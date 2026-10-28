-- Initial schema for a NEW Supabase project. See docs/database.md before using on an existing database.
begin;

create table public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  device_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.feed_schedule (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.user_data(user_id) on delete cascade,
  hour integer not null check (hour between 0 and 23),
  minute integer not null check (minute between 0 and 59),
  duration_sec integer not null check (duration_sec between 0 and 60),
  created_at timestamptz not null default now(),
  unique (user_id, hour, minute)
);

alter table public.user_data enable row level security;
alter table public.feed_schedule enable row level security;
revoke all on public.user_data, public.feed_schedule from anon, authenticated;
grant select on public.user_data, public.feed_schedule to authenticated;

create policy "Read own device" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own meals" on public.feed_schedule for select to authenticated using ((select auth.uid()) = user_id);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.user_data(user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Include accounts created before the migration.
insert into public.user_data(user_id) select id from auth.users on conflict (user_id) do nothing;

create function public.get_device_schedule(p_token text) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  owner_id uuid;
  result jsonb;
begin
  -- A shared lock prevents a token rotation from racing this read.
  select user_id into owner_id from public.user_data
    where device_token = p_token::uuid for share;
  if owner_id is null then
    raise exception 'Invalid device token' using errcode = '28000';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('hour', hour, 'minute', minute, 'duration_sec', duration_sec)
    order by hour, minute), '[]'::jsonb) into result
    from public.feed_schedule where user_id = owner_id;
  return result;
exception when invalid_text_representation then
  raise exception 'Invalid device token' using errcode = '28000';
end;
$$;
revoke all on function public.get_device_schedule(text) from public;
grant execute on function public.get_device_schedule(text) to anon, authenticated;

create function public.replace_feed_schedule(p_schedule jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  meal jsonb;
  field text;
  result jsonb;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  -- Serialize writes per account and require its provisioned profile.
  perform 1 from public.user_data where user_id = owner_id for update;
  if not found then raise exception 'Device profile missing'; end if;
  if jsonb_typeof(p_schedule) is distinct from 'array' then raise exception 'Expected an array'; end if;
  if jsonb_array_length(p_schedule) > 10 then raise exception 'At most 10 meals allowed'; end if;
  for meal in select * from jsonb_array_elements(p_schedule) loop
    foreach field in array array['hour', 'minute', 'duration_sec'] loop
      if jsonb_typeof(meal -> field) is distinct from 'number' then raise exception 'Expected numeric meal fields'; end if;
      if (meal ->> field)::numeric % 1 <> 0 then raise exception 'Expected whole numbers'; end if;
    end loop;
    if (meal ->> 'hour')::numeric not between 0 and 23
      or (meal ->> 'minute')::numeric not between 0 and 59
      or (meal ->> 'duration_sec')::numeric not between 0 and 60 then
      raise exception 'Meal out of range';
    end if;
  end loop;
  if (select count(*) <> count(distinct ((item ->> 'hour')::integer, (item ->> 'minute')::integer))
      from jsonb_array_elements(p_schedule) item) then raise exception 'Duplicate meal time'; end if;

  delete from public.feed_schedule where user_id = owner_id;
  insert into public.feed_schedule(user_id, hour, minute, duration_sec)
    select owner_id, hour, minute, duration_sec
    from jsonb_to_recordset(p_schedule) as x(hour integer, minute integer, duration_sec integer);
  select coalesce(jsonb_agg(jsonb_build_object('hour', hour, 'minute', minute, 'duration_sec', duration_sec)
    order by hour, minute), '[]'::jsonb) into result from public.feed_schedule where user_id = owner_id;
  return result;
end;
$$;
revoke all on function public.replace_feed_schedule(jsonb) from public, anon;
grant execute on function public.replace_feed_schedule(jsonb) to authenticated;

create function public.rotate_device_token() returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  new_token uuid;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  update public.user_data set device_token = gen_random_uuid() where user_id = owner_id returning device_token into new_token;
  if new_token is null then raise exception 'Device profile missing'; end if;
  return new_token;
end;
$$;
revoke all on function public.rotate_device_token() from public, anon;
grant execute on function public.rotate_device_token() to authenticated;

commit;
