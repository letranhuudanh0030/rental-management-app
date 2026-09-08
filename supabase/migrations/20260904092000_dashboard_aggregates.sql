create or replace function public.get_dashboard_totals(p_period_month date)
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'occupied_rooms', (
      select count(*) from public.rooms
      where user_id = auth.uid() and status = 'occupied'
    ),
    'total_rooms', (
      select count(*) from public.rooms
      where user_id = auth.uid()
    ),
    'tenant_count', (
      select count(*) from public.tenants
      where user_id = auth.uid()
    ),
    'month_revenue', coalesce((
      select sum(total_amount) from public.invoices
      where user_id = auth.uid()
        and period_month >= date_trunc('month', p_period_month)::date
        and period_month < (date_trunc('month', p_period_month) + interval '1 month')::date
        and payment_status in ('paid_cash', 'paid_transfer')
    ), 0),
    'unpaid_count', (
      select count(*) from public.invoices
      where user_id = auth.uid()
        and payment_status = 'unpaid'
        and due_date >= current_date
    ),
    'unpaid_total', coalesce((
      select sum(total_amount) from public.invoices
      where user_id = auth.uid()
        and payment_status = 'unpaid'
        and due_date >= current_date
    ), 0),
    'overdue_count', (
      select count(*) from public.invoices
      where user_id = auth.uid()
        and payment_status = 'unpaid'
        and due_date < current_date
    ),
    'overdue_total', coalesce((
      select sum(total_amount) from public.invoices
      where user_id = auth.uid()
        and payment_status = 'unpaid'
        and due_date < current_date
    ), 0)
  );
$$;

revoke execute on function public.get_dashboard_totals(date) from public;
grant execute on function public.get_dashboard_totals(date) to authenticated;
