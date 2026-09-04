create or replace function public.get_revenue_report(
  p_from_month date,
  p_to_month date
)
returns table(period_month date, invoice_count bigint, revenue bigint)
language sql
security invoker
set search_path = public
as $$
  select
    date_trunc('month', period_month)::date,
    count(*)::bigint,
    coalesce(sum(total_amount), 0)::bigint
  from public.invoices
  where user_id = auth.uid()
    and payment_status in ('paid_cash', 'paid_transfer')
    and period_month >= date_trunc('month', p_from_month)::date
    and period_month < (date_trunc('month', p_to_month) + interval '1 month')::date
  group by date_trunc('month', period_month)::date
  order by date_trunc('month', period_month)::date;
$$;

create or replace function public.get_outstanding_report()
returns table(
  invoice_id uuid,
  period_month date,
  due_date date,
  total_amount integer,
  debt_status text,
  room_id uuid,
  contract_id uuid
)
language sql
security invoker
set search_path = public
as $$
  select
    id,
    period_month,
    due_date,
    total_amount,
    case when due_date < current_date then 'overdue' else 'unpaid' end,
    room_id,
    contract_id
  from public.invoices
  where user_id = auth.uid()
    and payment_status = 'unpaid'
  order by due_date asc, created_at asc;
$$;

create or replace function public.get_occupancy_report()
returns jsonb
language sql
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'total_rooms', (
      select count(*) from public.rooms
      where user_id = auth.uid() and archived_at is null
    ),
    'occupied_rooms', (
      select count(*) from public.rooms
      where user_id = auth.uid() and archived_at is null and status = 'occupied'
    ),
    'vacant_rooms', (
      select count(*) from public.rooms
      where user_id = auth.uid() and archived_at is null and status = 'vacant'
    ),
    'maintenance_rooms', (
      select count(*) from public.rooms
      where user_id = auth.uid() and archived_at is null and status = 'maintenance'
    ),
    'active_contracts', (
      select count(*) from public.contracts
      where user_id = auth.uid() and is_active = true
    )
  );
$$;

revoke execute on function public.get_revenue_report(date, date) from public;
revoke execute on function public.get_outstanding_report() from public;
revoke execute on function public.get_occupancy_report() from public;
grant execute on function public.get_revenue_report(date, date) to authenticated;
grant execute on function public.get_outstanding_report() to authenticated;
grant execute on function public.get_occupancy_report() to authenticated;
