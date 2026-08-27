create or replace function public.assign_tenant_to_room(
  p_room_id uuid,
  p_tenant_id uuid default null,
  p_start_date date default current_date,
  p_monthly_rent integer default null,
  p_deposit integer default 0
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_tenant public.tenants%rowtype;
  v_contract_id uuid;
  v_previous_room_id uuid;
  v_rent integer;
begin
  if auth.uid() is null then
    raise exception using message = 'UNAUTHORIZED', errcode = 'P0001';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception using message = 'ROOM_NOT_FOUND', errcode = 'P0001';
  end if;
  if (to_jsonb(v_room)->>'archived_at') is not null then
    raise exception using message = 'ROOM_ARCHIVED', errcode = 'P0001';
  end if;

  if p_tenant_id is null then
    update public.contracts
    set is_active = false,
        end_date = least(coalesce(end_date, p_start_date - 1), p_start_date - 1)
    where user_id = auth.uid()
      and room_id = p_room_id
      and is_active = true;

    update public.rooms
    set status = 'vacant'
    where id = p_room_id and user_id = auth.uid();

    return jsonb_build_object('room_id', p_room_id, 'tenant_id', null, 'contract_id', null);
  end if;

  select * into v_tenant
  from public.tenants
  where id = p_tenant_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception using message = 'TENANT_NOT_FOUND', errcode = 'P0001';
  end if;

  select room_id into v_previous_room_id
  from public.contracts
  where user_id = auth.uid()
    and tenant_id = p_tenant_id
    and is_active = true
  order by created_at desc
  limit 1
  for update;

  update public.contracts
  set is_active = false,
      end_date = least(coalesce(end_date, p_start_date - 1), p_start_date - 1)
  where user_id = auth.uid()
    and (room_id = p_room_id or tenant_id = p_tenant_id)
    and is_active = true;

  v_rent := coalesce(p_monthly_rent, v_room.base_rent);
  if v_rent < 0 or p_deposit < 0 then
    raise exception using message = 'INVALID_AMOUNT', errcode = 'P0001';
  end if;

  insert into public.contracts (
    user_id, room_id, tenant_id, start_date, monthly_rent, deposit, is_active
  ) values (
    auth.uid(), p_room_id, p_tenant_id, p_start_date, v_rent, p_deposit, true
  ) returning id into v_contract_id;

  update public.rooms
  set status = 'occupied'
  where id = p_room_id and user_id = auth.uid();

  if v_previous_room_id is not null and v_previous_room_id <> p_room_id then
    update public.rooms
    set status = 'vacant'
    where id = v_previous_room_id
      and user_id = auth.uid()
      and not exists (
        select 1 from public.contracts
        where room_id = v_previous_room_id
          and user_id = auth.uid()
          and is_active = true
      );
  end if;

  return jsonb_build_object(
    'room_id', p_room_id,
    'tenant_id', p_tenant_id,
    'contract_id', v_contract_id
  );
end;
$$;
