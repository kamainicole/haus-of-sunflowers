-- =====================================================================
-- 009_api_schema.sql
-- The api schema stays intentionally empty of public content in
-- Phase 1 (no member/public users exist yet). The one view here is
-- for YOUR owner dashboard (Section 34) and demonstrates the pattern
-- Phase 3 will extend: security_invoker views over research.* so
-- the underlying RLS policies still apply to whoever queries it,
-- rather than running with the view creator's elevated permissions.
-- =====================================================================

create view api.dashboard_stats
with (security_invoker = true) as
select
  (select count(*) from research.sources) as total_sources,
  (select count(*) from research.materials) as total_materials,
  (select count(*) from research.map_locations) as total_map_records,
  (select count(*) from research.claims) as total_claims,
  (select count(*) from research.people) as total_people,
  (select count(*) from research.practices) as total_practices,
  (select count(*) from dissertation.notes) as total_dissertation_notes,
  (select count(*) from research.claims where status in ('investigating','preliminary')) as claims_needing_verification,
  (select count(*) from research.claim_sources) as cited_claim_links,
  (select count(*) from research.materials where created_at > now() - interval '30 days') as new_materials_this_month,
  (select count(*) from research.sources where created_at > now() - interval '30 days') as new_sources_this_month,
  (select count(*) filter (where visibility = 'private')) as private_records_materials,
  (select count(*) filter (where visibility not in ('private','private_dissertation','embargoed','internal_research'))) as published_records_materials
from research.materials;

comment on view api.dashboard_stats is
  'Owner dashboard counts. security_invoker=true means RLS on the underlying research/dissertation tables still applies — this view grants no extra access by itself.';

-- Because security_invoker views still run under the querying
-- user's own permissions, and dissertation.notes has no grant to
-- anon/authenticated at all (006_grants.sql), a non-owner querying
-- this view gets a permissions error on that subquery, not silently
-- wrong data. That's the correct failure mode.
