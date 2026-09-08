create or replace function public.get_profit_report(
  p_from_month date,
  p_to_month date
)
returns table (
  period_month date,
  revenue bigint,
  expenses bigint,
  profit bigint
)
language sql
security invoker
set search_path = public
as $$
  with months as (
    select generate_series(p_from_month, p_to_month, interval '1 month')::date as period_month
  ),
  revenue as (
    select period_month, sum(total_amount)::bigint as amount
    from public.invoices
    where payment_status in ('paid_cash', 'paid_transfer')
      and period_month between p_from_month and p_to_month
      and user_id = auth.uid()
    group by period_month
  ),
  expenses as (
    select date_trunc('month', expense_date)::date as period_month, sum(amount)::bigint as amount
    from public.expenses
    where expense_date >= p_from_month
      and expense_date < (p_to_month + interval '1 month')::date
      and user_id = auth.uid()
    group by date_trunc('month', expense_date)::date
  )
  select
    months.period_month,
    coalesce(revenue.amount, 0),
    coalesce(expenses.amount, 0),
    coalesce(revenue.amount, 0) - coalesce(expenses.amount, 0)
  from months
  left join revenue using (period_month)
  left join expenses using (period_month)
  order by months.period_month;
$$;
