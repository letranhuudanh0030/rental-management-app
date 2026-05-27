-- Rental Management MVP schema for small landlords (Vietnam)

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type room_status as enum ('occupied', 'vacant', 'maintenance');
create type payment_status as enum ('unpaid', 'paid_cash', 'paid_transfer');
create type payment_method as enum ('cash', 'transfer');

-- Landlord settings (one per user)
create table public.landlord_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  property_name text not null default 'Nhà trọ của tôi',
  electric_price integer not null default 4000 check (electric_price >= 0),
  water_price integer not null default 15000 check (water_price >= 0),
  invoice_due_day integer not null default 10 check (invoice_due_day between 1 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  floor integer not null default 1,
  base_rent integer not null check (base_rent >= 0),
  status room_status not null default 'vacant',
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index rooms_user_id_idx on public.rooms (user_id);

-- Tenants
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  id_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tenants_user_id_idx on public.tenants (user_id);

-- Contracts (links tenant to room)
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  start_date date not null,
  end_date date,
  monthly_rent integer not null check (monthly_rent >= 0),
  deposit integer not null default 0 check (deposit >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contracts_user_id_idx on public.contracts (user_id);
create index contracts_room_active_idx on public.contracts (room_id) where is_active = true;

-- Meter readings (period_month = first day of billing month)
create table public.meter_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  period_month date not null,
  electric_previous numeric(12, 2) not null default 0 check (electric_previous >= 0),
  electric_current numeric(12, 2) not null check (electric_current >= 0),
  water_previous numeric(12, 2) not null default 0 check (water_previous >= 0),
  water_current numeric(12, 2) not null check (water_current >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, period_month),
  check (electric_current >= electric_previous),
  check (water_current >= water_previous)
);

create index meter_readings_user_period_idx on public.meter_readings (user_id, period_month);

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete set null,
  period_month date not null,
  rent_amount integer not null default 0,
  electric_usage numeric(12, 2) not null default 0,
  electric_cost integer not null default 0,
  water_usage numeric(12, 2) not null default 0,
  water_cost integer not null default 0,
  other_fees integer not null default 0,
  total_amount integer not null default 0,
  due_date date not null,
  payment_status payment_status not null default 'unpaid',
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, period_month)
);

create index invoices_user_period_idx on public.invoices (user_id, period_month);
create index invoices_payment_status_idx on public.invoices (user_id, payment_status);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount integer not null check (amount > 0),
  method payment_method not null,
  paid_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index payments_invoice_id_idx on public.payments (invoice_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger landlord_settings_updated_at before update on public.landlord_settings
  for each row execute function public.set_updated_at();
create trigger rooms_updated_at before update on public.rooms
  for each row execute function public.set_updated_at();
create trigger tenants_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();
create trigger contracts_updated_at before update on public.contracts
  for each row execute function public.set_updated_at();
create trigger meter_readings_updated_at before update on public.meter_readings
  for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

-- Auto-create settings on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.landlord_settings (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.landlord_settings enable row level security;
alter table public.rooms enable row level security;
alter table public.tenants enable row level security;
alter table public.contracts enable row level security;
alter table public.meter_readings enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

-- Policies: landlord_settings
create policy "Users manage own settings"
  on public.landlord_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policies: rooms
create policy "Users select own rooms"
  on public.rooms for select using (auth.uid() = user_id);
create policy "Users insert own rooms"
  on public.rooms for insert with check (auth.uid() = user_id);
create policy "Users update own rooms"
  on public.rooms for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own rooms"
  on public.rooms for delete using (auth.uid() = user_id);

-- Policies: tenants
create policy "Users select own tenants"
  on public.tenants for select using (auth.uid() = user_id);
create policy "Users insert own tenants"
  on public.tenants for insert with check (auth.uid() = user_id);
create policy "Users update own tenants"
  on public.tenants for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own tenants"
  on public.tenants for delete using (auth.uid() = user_id);

-- Policies: contracts
create policy "Users select own contracts"
  on public.contracts for select using (auth.uid() = user_id);
create policy "Users insert own contracts"
  on public.contracts for insert with check (auth.uid() = user_id);
create policy "Users update own contracts"
  on public.contracts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own contracts"
  on public.contracts for delete using (auth.uid() = user_id);

-- Policies: meter_readings
create policy "Users select own meter readings"
  on public.meter_readings for select using (auth.uid() = user_id);
create policy "Users insert own meter readings"
  on public.meter_readings for insert with check (auth.uid() = user_id);
create policy "Users update own meter readings"
  on public.meter_readings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own meter readings"
  on public.meter_readings for delete using (auth.uid() = user_id);

-- Policies: invoices
create policy "Users select own invoices"
  on public.invoices for select using (auth.uid() = user_id);
create policy "Users insert own invoices"
  on public.invoices for insert with check (auth.uid() = user_id);
create policy "Users update own invoices"
  on public.invoices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own invoices"
  on public.invoices for delete using (auth.uid() = user_id);

-- Policies: payments
create policy "Users select own payments"
  on public.payments for select using (auth.uid() = user_id);
create policy "Users insert own payments"
  on public.payments for insert with check (auth.uid() = user_id);
create policy "Users update own payments"
  on public.payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete own payments"
  on public.payments for delete using (auth.uid() = user_id);
