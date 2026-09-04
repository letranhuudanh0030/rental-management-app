alter table public.invoices
  add column corrected_from_invoice_id uuid references public.invoices(id);

alter table public.invoices
  drop constraint if exists invoices_room_id_period_month_key;

create unique index if not exists invoices_one_active_per_room_period_idx
  on public.invoices (room_id, period_month)
  where payment_status <> 'void';

create or replace function public.correct_invoice(
  p_invoice_id uuid,
  p_invoice jsonb,
  p_lines jsonb,
  p_reason text
)
returns public.invoices
language plpgsql
security invoker
set search_path = public
as $$
declare
  old_invoice public.invoices%rowtype;
  new_invoice public.invoices%rowtype;
begin
  if nullif(trim(p_reason), '') is null then
    raise exception 'Cần nhập lý do điều chỉnh hóa đơn';
  end if;

  select * into old_invoice
  from public.invoices
  where id = p_invoice_id and user_id = auth.uid()
  for update;

  if not found then raise exception 'Không tìm thấy hóa đơn'; end if;
  if old_invoice.payment_status <> 'unpaid' then
    raise exception 'Chỉ có thể điều chỉnh hóa đơn chưa thanh toán';
  end if;
  if (p_invoice->>'room_id')::uuid <> old_invoice.room_id
     or (p_invoice->>'period_month')::date <> old_invoice.period_month then
    raise exception 'Invoice correction must keep the original room and period';
  end if;

  update public.invoices
  set payment_status = 'void', voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_reason)
  where id = p_invoice_id;

  insert into public.invoices (
    user_id, room_id, contract_id, period_month, rent_amount,
    electric_usage, electric_cost, water_usage, water_cost,
    other_fees, total_amount, due_date, payment_status, corrected_from_invoice_id
  ) values (
    auth.uid(), (p_invoice->>'room_id')::uuid, nullif(p_invoice->>'contract_id', '')::uuid,
    (p_invoice->>'period_month')::date, (p_invoice->>'rent_amount')::integer,
    (p_invoice->>'electric_usage')::numeric, (p_invoice->>'electric_cost')::integer,
    (p_invoice->>'water_usage')::numeric, (p_invoice->>'water_cost')::integer,
    (p_invoice->>'other_fees')::integer, (p_invoice->>'total_amount')::integer,
    (p_invoice->>'due_date')::date, 'unpaid', old_invoice.id
  ) returning * into new_invoice;

  insert into public.invoice_lines (user_id, invoice_id, line_type, description, quantity, unit_price, amount)
  select auth.uid(), new_invoice.id, line_type, description, quantity, unit_price, amount
  from jsonb_to_recordset(p_lines) as lines(
    line_type text, description text, quantity numeric, unit_price integer, amount integer
  );

  return new_invoice;
end;
$$;

revoke execute on function public.correct_invoice(uuid, jsonb, jsonb, text) from public;
grant execute on function public.correct_invoice(uuid, jsonb, jsonb, text) to authenticated;
