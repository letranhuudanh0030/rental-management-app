do $$
begin
  if exists (
    select 1
    from public.contracts
    where is_active
    group by room_id
    having count(*) > 1
  ) then
    raise exception 'Cannot add active room contract constraint while duplicate data exists';
  end if;

  if exists (
    select 1
    from public.contracts
    where is_active
    group by tenant_id
    having count(*) > 1
  ) then
    raise exception 'Cannot add active tenant contract constraint while duplicate data exists';
  end if;
end;
$$;

create unique index if not exists contracts_one_active_per_room_idx
  on public.contracts (room_id)
  where is_active = true;

create unique index if not exists contracts_one_active_per_tenant_idx
  on public.contracts (tenant_id)
  where is_active = true;
