create type public.payment_record_status as enum ('active', 'reversed');

alter table public.payments
  add column status public.payment_record_status not null default 'active',
  add column reversed_at timestamptz,
  add column reversed_by uuid references auth.users(id),
  add column reversal_reason text;

create unique index payments_one_active_per_invoice_idx
  on public.payments (invoice_id)
  where status = 'active';

create index payments_invoice_history_idx
  on public.payments (invoice_id, paid_at desc);

create or replace function public.reverse_invoice_payment(
  p_invoice_id uuid,
  p_reason text default 'Người dùng yêu cầu hoàn tác'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  invoice_row public.invoices%rowtype;
  payment_row public.payments%rowtype;
begin
  select * into invoice_row
  from public.invoices
  where id = p_invoice_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Không tìm thấy hóa đơn';
  end if;

  update public.payments
  set status = 'reversed',
      reversed_at = now(),
      reversed_by = auth.uid(),
      reversal_reason = nullif(trim(p_reason), '')
  where invoice_id = p_invoice_id
    and user_id = auth.uid()
    and status = 'active'
  returning * into payment_row;

  if not found then
    raise exception 'Hóa đơn chưa có thanh toán đang hiệu lực';
  end if;

  update public.invoices
  set payment_status = 'unpaid', paid_at = null
  where id = p_invoice_id and user_id = auth.uid();

  return jsonb_build_object(
    'payment', to_jsonb(payment_row),
    'payment_status', 'unpaid'
  );
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

  update public.payments
  set status = 'reversed',
      reversed_at = now(),
      reversed_by = auth.uid(),
      reversal_reason = 'Thay đổi phương thức thanh toán'
  where invoice_id = p_invoice_id
    and user_id = auth.uid()
    and status = 'active';

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

revoke execute on function public.reverse_invoice_payment(uuid, text) from public;
grant execute on function public.reverse_invoice_payment(uuid, text) to authenticated;
