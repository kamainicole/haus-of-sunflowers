-- =====================================================================
-- 011_security_hardening.sql
-- Fixes surfaced by Supabase's security linter after applying
-- migrations 001-010 against the real project. Neither issue was
-- visible just from reading the SQL beforehand.
-- =====================================================================

-- Functions without an explicit search_path are flagged because, in
-- principle, a manipulated search_path could make them resolve to
-- attacker-controlled objects with the same name instead of the
-- intended ones. Pinning search_path closes that off.
alter function internal.set_updated_at() set search_path = internal, pg_temp;
alter function research.normalize_tag_name() set search_path = research, pg_temp;
alter function research.immutable_array_to_string(text[], text) set search_path = pg_catalog, pg_temp;
alter function research.global_search(text, int) set search_path = research, pg_catalog, pg_temp;

-- pg_trgm installs into the public schema by default. Supabase
-- provides a dedicated `extensions` schema specifically so
-- extensions don't clutter (or gain unnecessary visibility in)
-- public/application schemas.
alter extension pg_trgm set schema extensions;
