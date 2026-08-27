create type public.contract_status as enum (
  'draft',
  'active',
  'terminated',
  'expired',
  'cancelled'
);

alter table public.contracts
  add column status public.contract_status not null default 'active',
  add column termination_date date,
  add column termination_reason text,
  add column notice_date date,
  add column renewed_from_contract_id uuid references public.contracts(id);

update public.contracts
set status = case when is_active then 'active'::public.contract_status else 'terminated'::public.contract_status end;

alter table public.rooms
  add column archived_at timestamptz,
  add column archived_by uuid references auth.users(id);

create index contracts_status_idx on public.contracts (user_id, status, start_date desc);
create index contracts_tenant_history_idx on public.contracts (tenant_id, start_date desc);
create index rooms_archived_idx on public.rooms (user_id, archived_at)
  where archived_at is not null;

create or replace function public.sync_contract_lifecycle_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.is_active := new.status = 'active';
  elsif new.status is distinct from old.status and new.is_active is not distinct from old.is_active then
    new.is_active := new.status = 'active';
  elsif new.is_active is distinct from old.is_active and new.status is not distinct from old.status then
    new.status := case when new.is_active then 'active'::public.contract_status else 'terminated'::public.contract_status end;
  else
    new.is_active := new.status = 'active';
  end if;
  return new;
end;
$$;

create trigger contracts_sync_lifecycle_fields
  before insert or update on public.contracts
  for each row execute function public.sync_contract_lifecycle_fields();
