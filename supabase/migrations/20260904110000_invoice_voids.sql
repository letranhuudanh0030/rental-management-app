alter type public.payment_status add value if not exists 'void';

alter table public.invoices
  add column voided_at timestamptz,
  add column voided_by uuid references auth.users(id),
  add column void_reason text;

create or replace function public.void_invoice(
  p_invoice_id uuid,
  p_reason text
)
returns public.invoices
language plpgsql
security invoker
set search_path = public
as $$
declare
  invoice_row public.invoices%rowtype;
begin
  if nullif(trim(p_reason), '') is null then
    raise exception 'Cần nhập lý do hủy hóa đơn';
  end if;

  select * into invoice_row
  from public.invoices
  where id = p_invoice_id and user_id = auth.uid()
  for update;

  if not found then raise exception 'Không tìm thấy hóa đơn'; end if;
  if invoice_row.payment_status <> 'unpaid' then
    raise exception 'Chỉ có thể hủy hóa đơn chưa thanh toán';
  end if;

  update public.invoices
  set payment_status = 'void', voided_at = now(), voided_by = auth.uid(), void_reason = trim(p_reason)
  where id = p_invoice_id and user_id = auth.uid()
  returning * into invoice_row;

  return invoice_row;
end;
$$;

revoke execute on function public.void_invoice(uuid, text) from public;
grant execute on function public.void_invoice(uuid, text) to authenticated;
