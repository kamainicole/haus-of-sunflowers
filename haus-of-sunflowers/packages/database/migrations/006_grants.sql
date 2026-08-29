-- =====================================================================
-- 006_grants.sql
-- Schema-level grants: the "wall" layer described in the architecture
-- doc. This is what makes the dissertation schema unreachable from
-- the public Data API regardless of what any RLS policy says.
--
-- Supabase's Data API connects as one of two Postgres roles:
--   anon          - unauthenticated requests
--   authenticated - logged-in requests
-- service_role bypasses RLS entirely and is only ever used by
-- trusted server-side code (never shipped to the browser/app).
-- =====================================================================

-- internal: NO grants to anon or authenticated. Ever.
-- (No revoke needed — schemas grant nothing by default. This
-- statement exists as an explicit, self-documenting guarantee.)
revoke all on schema internal from anon, authenticated;

-- research: authenticated users may use the schema (RLS still
-- decides row-by-row what they can actually see/edit).
-- anon gets nothing in Phase 1 — there is no public content yet.
grant usage on schema research to authenticated;
grant select, insert, update, delete on all tables in schema research to authenticated;
alter default privileges in schema research
  grant select, insert, update, delete on tables to authenticated;

-- dissertation: DELIBERATELY no grant to anon or authenticated at all.
-- This is the key architectural guarantee from the revision:
-- even a broken or missing RLS policy cannot expose this schema,
-- because the connecting role has no path into it whatsoever.
revoke all on schema dissertation from anon, authenticated;

-- api: reserved for curated public views, added starting Phase 3.
-- Grant usage now so the pattern exists, but the schema currently
-- contains nothing sensitive.
grant usage on schema api to anon, authenticated;

-- Sequences (uuid defaults don't need this, but future serial columns might)
alter default privileges in schema research grant usage on sequences to authenticated;
