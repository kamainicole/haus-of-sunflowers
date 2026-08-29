-- =====================================================================
-- 003_research_core_tables.sql
-- Core research entities. Every table gets:
--   - a UUID primary key
--   - visibility (default 'private')
--   - created_by / created_at / updated_at
-- so ownership, auditability, and access control are consistent
-- everywhere rather than reinvented per-table.
-- =====================================================================

-- ---------------------------------------------------------------------
-- SOURCES  (Section 7)
-- ---------------------------------------------------------------------
create type research.source_type as enum (
  'book', 'journal_article', 'dissertation', 'thesis', 'newspaper',
  'magazine', 'government_archive', 'folklore_collection', 'wpa_record',
  'oral_history', 'interview', 'court_record', 'census_record',
  'church_document', 'manuscript', 'letter', 'diary', 'photograph',
  'museum_record', 'archive_item', 'website', 'digital_archive',
  'recorded_lecture', 'field_notes', 'other'
);

create table research.sources (
  id uuid primary key default uuid_generate_v4(),
  source_type research.source_type not null,
  is_primary_source boolean, -- primary vs secondary classification
  title text not null,
  author text,
  editor text,
  publication text,
  publisher text,
  publication_year int,
  original_date research.historical_date,
  collection_date date,
  url text,
  doi text,
  isbn text,
  archive_name text,
  collection_name text,
  box_ref text,
  folder_ref text,
  document_number text,
  interview_number text,
  page_range text,
  location_text text, -- free-text location description of the source itself
  citation text,
  reliability_notes text,
  copyright_notes text,
  file_path text, -- Supabase Storage path, private bucket
  external_link text,
  notes text,
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table research.sources is 'Historical source-management system. Section 7.';

-- Short quotations/excerpts tied to a source (Section 38).
create table research.source_quotes (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid not null references research.sources(id) on delete cascade,
  quote text not null,
  page text,
  speaker text,
  context text,
  interpretation text,
  publication_permission boolean not null default false, -- can this excerpt ever go public?
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MATERIALS  (Section 5)
-- ---------------------------------------------------------------------
create table research.materials (
  id uuid primary key default uuid_generate_v4(),
  common_name text not null,
  botanical_name text,
  scientific_name text,
  historical_names text[],
  folk_names text[],
  regional_names text[],
  alternate_spellings text[],
  plant_family text,
  material_category text, -- root/herb/resin/mineral/oil/animal/ritual/other
  part_used text,
  geographic_origin text,
  native_range text,
  introduced_range text,

  -- Historical Hoodoo documentation
  documented_use text,
  practice_category text,
  historical_period research.historical_date,
  earliest_source_documented research.historical_date,
  location_documented text,
  practitioner_informant text,
  collector_researcher text,
  historical_terminology text,
  preparation_method text,
  application_method text,

  -- Research notes
  my_analysis text,
  personal_observations text,
  questions text,
  hypotheses text,
  contradictory_information text,
  leads_to_investigate text,

  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table research.materials is 'Materia medica database. Section 5.';

-- Occult/spiritual correspondences — DELIBERATELY a separate table
-- from materials, each with its own evidence classification and
-- optional source, so correspondence is never conflated with
-- historical Hoodoo evidence (Sections 2 and 6).
create table research.correspondences (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid not null references research.materials(id) on delete cascade,
  correspondence_type text not null, -- planet | zodiac | element | color | day_of_week | etc
  correspondence_value text not null,
  tradition_context text, -- which tradition this correspondence comes from
  evidence_classification research.evidence_classification not null default 'later_occult_literature',
  source_id uuid references research.sources(id),
  page_ref text,
  historical_period research.historical_date,
  notes text,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table research.correspondences is
  'Occult/spiritual correspondences for a material. Never treated as historical Hoodoo evidence by default.';

-- ---------------------------------------------------------------------
-- PRACTICES  (Section 6)
-- ---------------------------------------------------------------------
create table research.practices (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  description text,
  historical_period research.historical_date,
  my_analysis text,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- PEOPLE  (Section 11)
-- ---------------------------------------------------------------------
create table research.people (
  id uuid primary key default uuid_generate_v4(),
  full_name text,
  alternate_names text[],
  nicknames text[],
  historical_terminology_for_them text,
  category text, -- practitioner | rootworker | informant | folklorist | etc
  birth_date research.historical_date,
  death_date research.historical_date,
  location_text text,
  biography text,
  role text,
  communities text[],
  identity_certainty text, -- e.g. 'confirmed' | 'pseudonymous' | 'partially_identified' | 'unknown'
  reliability_notes text,
  notes text,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- MAP LOCATIONS  (Section 9)
-- ---------------------------------------------------------------------
create table research.map_locations (
  id uuid primary key default uuid_generate_v4(),
  location_name text not null,
  city text,
  county text,
  state text,
  region text,
  latitude double precision,
  longitude double precision,
  location_precision research.location_precision not null default 'unknown',
  historical_location_name text,
  modern_location_name text,
  event_date research.historical_date,
  historical_period text,
  practice_documented text,
  material_documented text,
  practitioner_informant text,
  description text,
  research_notes text,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table research.map_locations is
  'Interactive map records. location_precision prevents false coordinate certainty. Section 9.';

-- ---------------------------------------------------------------------
-- TERMINOLOGY  (moved to Phase 1 per revision request)
-- ---------------------------------------------------------------------
create table research.terminology (
  id uuid primary key default uuid_generate_v4(),
  term text not null,
  alternate_spellings text[],
  historical_meaning text,
  modern_meaning text,
  quoted_usage text,
  earliest_documented_usage research.historical_date,
  region text,
  period text,
  interpretation_notes text,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CLAIMS  (Section 8)
-- ---------------------------------------------------------------------
create type research.claim_status as enum (
  'investigating', 'preliminary', 'moderate_support', 'strong_support',
  'contested', 'rejected', 'published_interpretation'
);

create table research.claims (
  id uuid primary key default uuid_generate_v4(),
  claim_title text not null,
  claim_statement text not null,
  topic text,
  status research.claim_status not null default 'investigating',
  confidence_level text,
  my_analysis text,
  questions text,
  methodological_concerns text,
  alternative_explanations text,
  dissertation_relevance text,
  time_period research.historical_date,
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RESEARCH NOTES  (freeform, linkable to anything via polymorphic ref)
-- ---------------------------------------------------------------------
create table research.research_notes (
  id uuid primary key default uuid_generate_v4(),
  title text,
  body text not null,
  related_entity_type text, -- 'material' | 'source' | 'practice' | 'person' | 'location' | 'claim' | 'terminology' | null
  related_entity_id uuid,
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RESEARCH INBOX / QUICK CAPTURE  (added per revision request)
-- ---------------------------------------------------------------------
create type research.inbox_status as enum (
  'unprocessed', 'reviewing', 'needs_source_verification',
  'needs_citation', 'needs_location_verification', 'processed', 'archived'
);

create table research.inbox_items (
  id uuid primary key default uuid_generate_v4(),
  title text,
  raw_note text,
  url text,
  source_title_guess text,
  author_guess text,
  page_guess text,
  quote_excerpt text,
  file_path text, -- image / screenshot / pdf / voice note in private storage
  approximate_location text,
  approximate_date text,
  status research.inbox_status not null default 'unprocessed',
  -- when processed, this points at whatever structured record it became.
  -- the inbox row itself is NEVER deleted automatically.
  converted_to_entity_type text,
  converted_to_entity_id uuid,
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id),
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table research.inbox_items is
  'Low-friction capture. Converting to a structured record links it via converted_to_* but never deletes the original.';

-- ---------------------------------------------------------------------
-- TAGS + polymorphic TAGGINGS  (Section 18)
-- ---------------------------------------------------------------------
create table research.tags (
  id uuid primary key default uuid_generate_v4(),
  -- normalized_name prevents "Protection" / "protection" / " Protection"
  -- from becoming three different tags (explicitly requested in Section 18).
  name text not null,
  normalized_name text not null unique,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function research.normalize_tag_name()
returns trigger
language plpgsql
as $$
begin
  new.normalized_name := lower(trim(new.name));
  return new;
end;
$$;

create trigger trg_tags_normalize
  before insert or update on research.tags
  for each row execute function research.normalize_tag_name();

create table research.taggings (
  id uuid primary key default uuid_generate_v4(),
  tag_id uuid not null references research.tags(id) on delete cascade,
  -- polymorphic: works across research.* and dissertation.* alike
  entity_type text not null, -- 'material' | 'source' | 'practice' | 'person' | 'map_location' | 'claim' | 'terminology' | 'inbox_item' | 'dissertation_note' | ...
  entity_id uuid not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tag_id, entity_type, entity_id)
);

create index idx_taggings_entity on research.taggings (entity_type, entity_id);

-- updated_at triggers for every table above ----------------------------
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'sources','source_quotes','materials','correspondences','practices',
      'people','map_locations','terminology','claims','research_notes',
      'inbox_items'
    ])
  loop
    execute format(
      'create trigger trg_%s_updated_at before update on research.%I
       for each row execute function internal.set_updated_at();',
      t, t
    );
  end loop;
end $$;
