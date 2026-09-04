alter function public.correct_invoice(uuid, jsonb, jsonb, text)
  security definer;

alter function public.correct_invoice(uuid, jsonb, jsonb, text)
  set search_path = public;

revoke execute on function public.correct_invoice(uuid, jsonb, jsonb, text)
  from public;

grant execute on function public.correct_invoice(uuid, jsonb, jsonb, text)
  to authenticated;
