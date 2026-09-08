create or replace function public.record_invoice_payment(
  p_invoice_id uuid,
  p_method payment_method,
  p_amount integer,
  p_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  invoice_row public.invoices%rowtype;
  payment_row public.payments%rowtype;
  next_status public.payment_status;
begin
  select * into invoice_row
  from public.invoices
  where id = p_invoice_id and user_id = auth.uid()
  for update;

  if not found then raise exception 'Không tìm thấy hóa đơn'; end if;
  if invoice_row.payment_status <> 'unpaid' then raise exception 'Hóa đơn đã được thanh toán'; end if;
  if p_amount is null or p_amount <> invoice_row.total_amount then
    raise exception 'Số tiền thanh toán phải bằng tổng hóa đơn';
  end if;

  next_status := case when p_method = 'cash' then 'paid_cash' else 'paid_transfer' end;
  insert into public.payments (user_id, invoice_id, amount, method, notes)
  values (auth.uid(), p_invoice_id, p_amount, p_method, p_notes)
  returning * into payment_row;

  update public.invoices
  set payment_status = next_status, paid_at = payment_row.paid_at
  where id = p_invoice_id and user_id = auth.uid();

  return jsonb_build_object('payment', to_jsonb(payment_row), 'payment_status', next_status);
end;
$$;

create or replace function public.reverse_invoice_payment(p_invoice_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (select 1 from public.invoices where id = p_invoice_id and user_id = auth.uid()) then
    raise exception 'Không tìm thấy hóa đơn';
  end if;

  delete from public.payments where invoice_id = p_invoice_id and user_id = auth.uid();
  update public.invoices set payment_status = 'unpaid', paid_at = null
  where id = p_invoice_id and user_id = auth.uid();
  return jsonb_build_object('success', true, 'payment_status', 'unpaid');
end;
$$;

create or replace function public.replace_invoice_payment(
  p_invoice_id uuid,
  p_method payment_method,
  p_amount integer,
  p_notes text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  invoice_row public.invoices%rowtype;
  payment_row public.payments%rowtype;
  next_status public.payment_status;
begin
  select * into invoice_row
  from public.invoices
  where id = p_invoice_id and user_id = auth.uid()
  for update;

  if not found then raise exception 'Không tìm thấy hóa đơn'; end if;
  if p_amount is null or p_amount <> invoice_row.total_amount then
    raise exception 'Số tiền thanh toán phải bằng tổng hóa đơn';
  end if;

  next_status := case when p_method = 'cash' then 'paid_cash' else 'paid_transfer' end;
  delete from public.payments where invoice_id = p_invoice_id and user_id = auth.uid();
  insert into public.payments (user_id, invoice_id, amount, method, notes)
  values (auth.uid(), p_invoice_id, p_amount, p_method, p_notes)
  returning * into payment_row;
  update public.invoices set payment_status = next_status, paid_at = payment_row.paid_at
  where id = p_invoice_id and user_id = auth.uid();
  return jsonb_build_object('payment', to_jsonb(payment_row), 'payment_status', next_status);
end;
$$;

revoke execute on function public.record_invoice_payment(uuid, payment_method, integer, text) from public;
revoke execute on function public.reverse_invoice_payment(uuid) from public;
revoke execute on function public.replace_invoice_payment(uuid, payment_method, integer, text) from public;
grant execute on function public.record_invoice_payment(uuid, payment_method, integer, text) to authenticated;
grant execute on function public.reverse_invoice_payment(uuid) to authenticated;
grant execute on function public.replace_invoice_payment(uuid, payment_method, integer, text) to authenticated;
