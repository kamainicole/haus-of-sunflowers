-- =====================================================================
-- 002_internal_schema.sql
-- Roles and profiles. This table is what every RLS policy in
-- research/dissertation checks against to decide who can see what.
-- =====================================================================

create table internal.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role internal.app_role not null default 'public_preview',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table internal.user_profiles is
  'One row per authenticated user. role drives every RLS policy in research/dissertation.';

-- Helper function used inside RLS policies throughout the app.
-- SECURITY DEFINER so it can read internal.user_profiles even though
-- that schema itself is not exposed to the API roles.
create or replace function internal.current_user_role()
returns internal.app_role
language sql
security definer
stable
set search_path = internal, pg_temp
as $$
  select role from internal.user_profiles where id = auth.uid();
$$;

create or replace function internal.is_owner()
returns boolean
language sql
security definer
stable
set search_path = internal, pg_temp
as $$
  select coalesce(
    (select role = 'owner' from internal.user_profiles where id = auth.uid()),
    false
  );
$$;

-- Keep updated_at current on edits.
create or replace function internal.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_user_profiles_updated_at
  before update on internal.user_profiles
  for each row execute function internal.set_updated_at();

-- When a new auth user is created, give them a profile row.
-- The FIRST user to sign up becomes owner; every subsequent
-- signup defaults to public_preview until you manually promote them.
-- (You are expected to be the first and only signup in Phase 1.)
create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = internal, pg_temp
as $$
declare
  is_first_user boolean;
begin
  select not exists(select 1 from internal.user_profiles) into is_first_user;

  insert into internal.user_profiles (id, role)
  values (new.id, case when is_first_user then 'owner' else 'public_preview' end);

  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function internal.handle_new_user();

-- internal schema is a utility closet: no grants to anon/authenticated
-- at all. Only the SECURITY DEFINER functions above (owned by a
-- privileged role) may read it. This is enforced in 006_grants.sql.
