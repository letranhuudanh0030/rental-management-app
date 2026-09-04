create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null check (category in ('maintenance', 'utilities', 'tax', 'other')),
  amount integer not null check (amount > 0),
  expense_date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_user_date_idx on public.expenses (user_id, expense_date desc);

alter table public.expenses enable row level security;

create policy "Users can view own expenses"
  on public.expenses for select using (auth.uid() = user_id);
create policy "Users can create own expenses"
  on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses"
  on public.expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses"
  on public.expenses for delete using (auth.uid() = user_id);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();
