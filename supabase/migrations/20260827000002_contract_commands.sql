create or replace function public.create_contract(
  p_room_id uuid,
  p_tenant_id uuid,
  p_start_date date,
  p_end_date date default null,
  p_monthly_rent integer default 0,
  p_deposit integer default 0,
  p_status public.contract_status default 'active'
)
returns public.contracts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_contract public.contracts%rowtype;
begin
  if p_end_date is not null and p_end_date <= p_start_date then
    raise exception using message = 'END_DATE_BEFORE_START', errcode = 'P0001';
  end if;
  if p_monthly_rent < 0 or p_deposit < 0 then
    raise exception using message = 'INVALID_AMOUNT', errcode = 'P0001';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception using message = 'ROOM_NOT_FOUND', errcode = 'P0001';
  end if;
  if v_room.archived_at is not null then
    raise exception using message = 'ROOM_ARCHIVED', errcode = 'P0001';
  end if;
  if not exists (select 1 from public.tenants where id = p_tenant_id and user_id = auth.uid()) then
    raise exception using message = 'TENANT_NOT_FOUND', errcode = 'P0001';
  end if;

  if p_status = 'active' then
    update public.contracts
    set is_active = false,
        status = 'terminated',
        termination_date = p_start_date - 1
    where user_id = auth.uid()
      and (room_id = p_room_id or tenant_id = p_tenant_id)
      and is_active = true;
  end if;

  insert into public.contracts (
    user_id, room_id, tenant_id, start_date, end_date,
    monthly_rent, deposit, is_active, status
  ) values (
    auth.uid(), p_room_id, p_tenant_id, p_start_date, p_end_date,
    p_monthly_rent, p_deposit, p_status = 'active', p_status
  ) returning * into v_contract;

  if p_status = 'active' then
    update public.rooms set status = 'occupied'
    where id = p_room_id and user_id = auth.uid();
  end if;

  return v_contract;
end;
$$;

create or replace function public.terminate_contract(
  p_contract_id uuid,
  p_termination_date date,
  p_termination_reason text,
  p_notice_date date default null
)
returns public.contracts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_contract public.contracts%rowtype;
begin
  update public.contracts
  set is_active = false,
      status = case when end_date is not null and p_termination_date >= end_date then 'expired' else 'terminated' end,
      termination_date = p_termination_date,
      termination_reason = nullif(trim(p_termination_reason), ''),
      notice_date = p_notice_date
  where id = p_contract_id
    and user_id = auth.uid()
    and is_active = true
  returning * into v_contract;

  if not found then
    raise exception using message = 'CONTRACT_NOT_FOUND_OR_INACTIVE', errcode = 'P0001';
  end if;
  if p_termination_date < v_contract.start_date then
    raise exception using message = 'TERMINATION_BEFORE_START', errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.contracts
    where room_id = v_contract.room_id and user_id = auth.uid() and is_active = true
  ) then
    update public.rooms set status = 'vacant'
    where id = v_contract.room_id and user_id = auth.uid() and status = 'occupied';
  end if;
  return v_contract;
end;
$$;

create or replace function public.renew_contract(
  p_contract_id uuid,
  p_start_date date,
  p_end_date date default null,
  p_monthly_rent integer default 0,
  p_deposit integer default 0
)
returns public.contracts
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_previous public.contracts%rowtype;
  v_new public.contracts%rowtype;
begin
  select * into v_previous
  from public.contracts
  where id = p_contract_id and user_id = auth.uid()
  for update;
  if not found then
    raise exception using message = 'CONTRACT_NOT_FOUND', errcode = 'P0001';
  end if;
  if p_start_date <= v_previous.start_date or
     (v_previous.end_date is not null and p_start_date <= v_previous.end_date) then
    raise exception using message = 'RENEWAL_OVERLAPS_PREVIOUS', errcode = 'P0001';
  end if;

  if v_previous.is_active then
    update public.contracts
    set is_active = false, status = 'expired', termination_date = p_start_date - 1
    where id = p_contract_id;
  end if;

  insert into public.contracts (
    user_id, room_id, tenant_id, start_date, end_date,
    monthly_rent, deposit, is_active, status, renewed_from_contract_id
  ) values (
    auth.uid(), v_previous.room_id, v_previous.tenant_id, p_start_date, p_end_date,
    p_monthly_rent, p_deposit, true, 'active', p_contract_id
  ) returning * into v_new;
  update public.rooms set status = 'occupied'
  where id = v_previous.room_id and user_id = auth.uid();
  return v_new;
end;
$$;
