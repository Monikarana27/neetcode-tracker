-- DSA Forge · optional cross-device sync
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- Security model
--   * The table has RLS enabled and NO policies, and anon/authenticated have no
--     table privileges. The public anon key therefore cannot SELECT, INSERT,
--     UPDATE or DELETE rows directly, and cannot list or dump the table.
--   * The only way in is two SECURITY DEFINER functions. Each one touches exactly
--     one row: the row whose key equals the code you pass in.
--   * A sync code is a bearer secret: it must be a random UUIDv4 (122 random bits),
--     so weak, guessable codes like "hello" are rejected by the database itself.
--   * Size and row-count caps limit what someone abusing the public anon key can store.

create table if not exists public.sync_data (
  code       text        primary key
             check (code ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  payload    jsonb       not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sync_data enable row level security;
-- Deliberately no policies: with RLS on and nothing allowed, direct access is denied.
-- (Do NOT add "using (true)" policies, and do NOT use FORCE ROW LEVEL SECURITY: the
--  functions below run as the table owner and rely on bypassing RLS.)

revoke all on table public.sync_data from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_sync_payload(p_code) → {"payload": {...}, "updated_at": "..."} or NULL
-- ---------------------------------------------------------------------------
create or replace function public.get_sync_payload(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text := lower(btrim(p_code));
  v_row  jsonb;
begin
  if v_code is null
     or v_code !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'Invalid sync code' using errcode = '22023';
  end if;

  select jsonb_build_object('payload', d.payload, 'updated_at', d.updated_at)
    into v_row
    from public.sync_data d
   where d.code = v_code;

  return v_row;  -- NULL when this code has no data yet
end;
$$;

-- ---------------------------------------------------------------------------
-- upsert_sync_payload(p_code, p_payload) → new updated_at
-- ---------------------------------------------------------------------------
create or replace function public.upsert_sync_payload(p_code text, p_payload jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_max_bytes constant int := 3000000;  -- max payload size (as JSON text)
  c_max_rows  constant int := 2000;     -- max distinct sync codes in this table
  v_code    text := lower(btrim(p_code));
  v_updated timestamptz;
begin
  if v_code is null
     or v_code !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'Invalid sync code' using errcode = '22023';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Payload must be a JSON object' using errcode = '22023';
  end if;

  if octet_length(p_payload::text) > c_max_bytes then
    raise exception 'Payload too large' using errcode = '54000';
  end if;

  if not exists (select 1 from public.sync_data d where d.code = v_code)
     and (select count(*) from public.sync_data) >= c_max_rows then
    raise exception 'Sync capacity reached' using errcode = '53400';
  end if;

  insert into public.sync_data as d (code, payload)
  values (v_code, p_payload)
  on conflict (code)
  do update set payload = excluded.payload, updated_at = now()
  returning d.updated_at into v_updated;

  return v_updated;
end;
$$;

-- Only the anon role may call them (Supabase grants execute to other roles by
-- default on new functions, so revoke first). Add `authenticated` here only if you
-- later add real logins.
revoke all on function public.get_sync_payload(text)            from public, anon, authenticated;
revoke all on function public.upsert_sync_payload(text, jsonb)  from public, anon, authenticated;
grant execute on function public.get_sync_payload(text)           to anon;
grant execute on function public.upsert_sync_payload(text, jsonb) to anon;

notify pgrst, 'reload schema';
