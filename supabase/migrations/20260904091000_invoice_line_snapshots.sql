create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  line_type text not null check (line_type in ('rent', 'electricity', 'water', 'garbage', 'other')),
  description text not null,
  quantity numeric(12, 2) not null check (quantity >= 0),
  unit_price integer not null check (unit_price >= 0),
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index invoice_lines_invoice_idx on public.invoice_lines (invoice_id);

alter table public.invoice_lines enable row level security;

create policy "Users select own invoice lines"
  on public.invoice_lines for select using (auth.uid() = user_id);

create policy "Users insert own invoice lines"
  on public.invoice_lines for insert with check (auth.uid() = user_id);

create or replace function public.create_invoice_with_lines(
  p_invoice jsonb,
  p_lines jsonb
)
returns public.invoices
language plpgsql
security invoker
set search_path = public
as $$
declare
  invoice_row public.invoices%rowtype;
begin
  insert into public.invoices (
    user_id, room_id, contract_id, period_month, rent_amount,
    electric_usage, electric_cost, water_usage, water_cost,
    other_fees, total_amount, due_date, payment_status
  ) values (
    auth.uid(),
    (p_invoice->>'room_id')::uuid,
    nullif(p_invoice->>'contract_id', '')::uuid,
    (p_invoice->>'period_month')::date,
    (p_invoice->>'rent_amount')::integer,
    (p_invoice->>'electric_usage')::numeric,
    (p_invoice->>'electric_cost')::integer,
    (p_invoice->>'water_usage')::numeric,
    (p_invoice->>'water_cost')::integer,
    (p_invoice->>'other_fees')::integer,
    (p_invoice->>'total_amount')::integer,
    (p_invoice->>'due_date')::date,
    'unpaid'
  ) returning * into invoice_row;

  insert into public.invoice_lines (
    user_id, invoice_id, line_type, description, quantity, unit_price, amount
  )
  select
    auth.uid(), invoice_row.id, line_type, description, quantity, unit_price, amount
  from jsonb_to_recordset(p_lines) as lines(
    line_type text,
    description text,
    quantity numeric,
    unit_price integer,
    amount integer
  );

  return invoice_row;
end;
$$;

revoke execute on function public.create_invoice_with_lines(jsonb, jsonb) from public;
grant execute on function public.create_invoice_with_lines(jsonb, jsonb) to authenticated;
