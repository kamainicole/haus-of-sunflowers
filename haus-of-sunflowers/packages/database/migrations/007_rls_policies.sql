-- =====================================================================
-- 007_rls_policies.sql
-- Row-level security. Phase 1 rule is simple: only the owner (and
-- service_role, which bypasses RLS entirely) can read or write
-- anything in research.* or dissertation.*.
--
-- This is written so Phase 3 can ADD policies (e.g. "members may
-- select rows where visibility = 'member_only'") without touching
-- these owner policies at all.
-- =====================================================================

-- Enable RLS on every research + dissertation table -------------------
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename
    from pg_tables
    where schemaname in ('research', 'dissertation')
  loop
    execute format('alter table %I.%I enable row level security;', r.schemaname, r.tablename);
    execute format('alter table %I.%I force row level security;', r.schemaname, r.tablename);
  end loop;
end $$;

-- One owner-all-access policy per table --------------------------------
-- (force row level security above means even the table owner role
-- must go through RLS — belt and suspenders.)
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename
    from pg_tables
    where schemaname in ('research', 'dissertation')
  loop
    execute format(
      'create policy owner_full_access on %I.%I
         for all
         using (internal.is_owner())
         with check (internal.is_owner());',
      r.schemaname, r.tablename
    );
  end loop;
end $$;

-- =====================================================================
-- Phase 3 extension pattern (documented here, not yet created):
--
-- create policy member_can_view_published on research.materials
--   for select
--   using (
--     visibility in ('member_only','premium_member','public_preview','published_public')
--     and internal.current_user_role() in ('student_member','researcher_editor')
--   );
--
-- Because Postgres RLS policies are OR'd together, adding policies
-- like this later never weakens the owner_full_access policy above —
-- it only adds additional ways for OTHER roles to see MORE narrowly
-- scoped rows. The dissertation schema should never receive a policy
-- like this; it has no non-owner audience by design.
-- =====================================================================
