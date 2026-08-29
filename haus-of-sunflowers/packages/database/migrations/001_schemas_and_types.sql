-- =====================================================================
-- 001_schemas_and_types.sql
-- Foundation: schemas, extensions, and shared types used across
-- the research and dissertation schemas.
-- =====================================================================

-- Extensions ----------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- fuzzy/fast text search support

-- Schemas ---------------------------------------------------------------
-- internal      : roles/profiles, never queried by app-facing code
-- research       : the working Hoodoo research database
-- dissertation   : private dissertation workspace (no API grants — see 006)
-- api            : curated public-facing views only (empty in Phase 1)
create schema if not exists internal;
create schema if not exists research;
create schema if not exists dissertation;
create schema if not exists api;

comment on schema internal is 'User roles/profiles. Never exposed to the Data API.';
comment on schema research is 'Working Hoodoo research database. RLS-protected, owner-only in Phase 1.';
comment on schema dissertation is 'Private dissertation workspace. RLS-protected AND excluded from Data API grants.';
comment on schema api is 'Curated views for public/member-facing queries. Empty until Phase 3 member access.';

-- Shared enum types -----------------------------------------------------

-- Visibility applies to every major research record (Section 4 of the brief).
-- Default for new rows is always 'private' — nothing is public by accident.
create type research.visibility_level as enum (
  'private',
  'private_dissertation',
  'embargoed',
  'internal_research',
  'member_only',
  'premium_member',
  'public_preview',
  'published_public',
  'archived'
);

-- Evidence classification — keeps historical evidence, occult
-- correspondence, folklore, and personal analysis structurally distinct.
create type research.evidence_classification as enum (
  'primary_historical_evidence',
  'secondary_scholarship',
  'oral_history',
  'archival_material',
  'folklore_collection',
  'historical_newspaper',
  'court_record',
  'government_collection',
  'dissertation_thesis',
  'contemporary_practitioner_account',
  'later_occult_literature',
  'comparative_diasporic_material',
  'my_analysis',
  'my_hypothesis',
  'unverified'
);

-- Research status — how confident/complete a record currently is.
create type research.record_status as enum (
  'verified',
  'strong_evidence',
  'moderate_evidence',
  'preliminary',
  'unverified',
  'disputed',
  'interpretation',
  'modern_attribution',
  'needs_further_research'
);

-- Historical date precision — never force false modern precision
-- onto uncertain historical evidence (Section 37).
create type research.date_precision as enum (
  'exact',
  'month_year',
  'year_only',
  'approximate_year',
  'date_range',
  'before_date',
  'after_date',
  'circa',
  'unknown'
);

-- A composite type for a historical date, reused on any table that
-- needs one (materials, sources, map_locations, terminology, etc).
create type research.historical_date as (
  precision research.date_precision,
  date_value date,          -- used for exact/month_year/year_only/before/after/circa anchor
  range_start date,         -- used when precision = 'date_range'
  range_end date,
  display_text text         -- human-readable fallback, e.g. "late 1930s"
);

-- Location precision — county/state/plantation-level records are
-- common and must not be forced into false coordinate precision (Section 9).
create type research.location_precision as enum (
  'exact',
  'approximate',
  'county_level',
  'state_level',
  'region_level',
  'unknown'
);

-- Roles for the internal.user_profiles table.
create type internal.app_role as enum (
  'owner',
  'researcher_editor',
  'student_member',
  'public_preview'
);
