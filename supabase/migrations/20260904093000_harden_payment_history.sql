drop function if exists public.reverse_invoice_payment(uuid);

drop policy if exists "Users delete own payments" on public.payments;
drop policy if exists "Users insert own payments" on public.payments;
drop policy if exists "Users update own payments" on public.payments;

drop policy if exists "Users insert own invoice lines" on public.invoice_lines;

alter function public.record_invoice_payment(uuid, public.payment_method, integer, text)
	security definer;

alter function public.replace_invoice_payment(uuid, public.payment_method, integer, text)
	security definer;

alter function public.reverse_invoice_payment(uuid, text)
	security definer;

alter function public.create_invoice_with_lines(jsonb, jsonb)
	security definer;

revoke delete on table public.payments from anon, authenticated;
revoke insert, update on table public.payments from anon, authenticated;
revoke insert on table public.invoice_lines from anon, authenticated;
