alter table if exists public.landlord_settings
add garbage_price integer not null default 5000 check (garbage_price >= 0);