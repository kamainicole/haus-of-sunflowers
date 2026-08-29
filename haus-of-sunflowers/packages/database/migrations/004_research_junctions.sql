-- =====================================================================
-- 004_research_junctions.sql
-- Many-to-many relationships. Every junction table carries its own
-- provenance columns (source, page, quote, evidence classification,
-- notes) so a relationship is never a bare link — it's a link plus
-- the evidence behind it (Section 7 of the revision).
-- =====================================================================

-- A reusable set of provenance columns is repeated deliberately on
-- each table below (rather than abstracted into one shared table)
-- so each relationship type can be queried and filtered directly
-- without extra joins.

create table research.material_sources (
  id uuid primary key default uuid_generate_v4(),
  material_id uuid not null references research.materials(id) on delete cascade,
  source_id uuid not null references research.sources(id) on delete cascade,
  page_ref text,
  quote text,
  evidence_classification research.evidence_classification not null default 'unverified',
  practitioner_informant text,
  event_date research.historical_date,
  location_text text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (material_id, source_id, page_ref)
);

create table research.practice_sources (
  id uuid primary key default uuid_generate_v4(),
  practice_id uuid not null references research.practices(id) on delete cascade,
  source_id uuid not null references research.sources(id) on delete cascade,
  page_ref text,
  quote text,
  evidence_classification research.evidence_classification not null default 'unverified',
  practitioner_informant text,
  event_date research.historical_date,
  location_text text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (practice_id, source_id, page_ref)
);

create table research.practice_materials (
  id uuid primary key default uuid_generate_v4(),
  practice_id uuid not null references research.practices(id) on delete cascade,
  material_id uuid not null references research.materials(id) on delete cascade,
  source_id uuid references research.sources(id),
  page_ref text,
  quote text,
  evidence_classification research.evidence_classification not null default 'unverified',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (practice_id, material_id, source_id)
);

create table research.practice_people (
  id uuid primary key default uuid_generate_v4(),
  practice_id uuid not null references research.practices(id) on delete cascade,
  person_id uuid not null references research.people(id) on delete cascade,
  source_id uuid references research.sources(id),
  page_ref text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (practice_id, person_id, source_id)
);

create table research.practice_locations (
  id uuid primary key default uuid_generate_v4(),
  practice_id uuid not null references research.practices(id) on delete cascade,
  location_id uuid not null references research.map_locations(id) on delete cascade,
  source_id uuid references research.sources(id),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (practice_id, location_id)
);

create table research.person_sources (
  id uuid primary key default uuid_generate_v4(),
  person_id uuid not null references research.people(id) on delete cascade,
  source_id uuid not null references research.sources(id) on delete cascade,
  page_ref text,
  quote text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (person_id, source_id, page_ref)
);

create table research.location_sources (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references research.map_locations(id) on delete cascade,
  source_id uuid not null references research.sources(id) on delete cascade,
  page_ref text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (location_id, source_id, page_ref)
);

create table research.location_materials (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references research.map_locations(id) on delete cascade,
  material_id uuid not null references research.materials(id) on delete cascade,
  source_id uuid references research.sources(id),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (location_id, material_id, source_id)
);

create table research.location_people (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid not null references research.map_locations(id) on delete cascade,
  person_id uuid not null references research.people(id) on delete cascade,
  source_id uuid references research.sources(id),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (location_id, person_id, source_id)
);

create table research.claim_sources (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid not null references research.claims(id) on delete cascade,
  source_id uuid not null references research.sources(id) on delete cascade,
  stance text not null default 'neutral', -- 'supporting' | 'contradicting' | 'neutral'
  page_ref text,
  quote text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (claim_id, source_id, page_ref),
  constraint chk_claim_source_stance check (stance in ('supporting','contradicting','neutral'))
);

create table research.claim_materials (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid not null references research.claims(id) on delete cascade,
  material_id uuid not null references research.materials(id) on delete cascade,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (claim_id, material_id)
);

create table research.claim_practices (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid not null references research.claims(id) on delete cascade,
  practice_id uuid not null references research.practices(id) on delete cascade,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (claim_id, practice_id)
);

create table research.claim_people (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid not null references research.claims(id) on delete cascade,
  person_id uuid not null references research.people(id) on delete cascade,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (claim_id, person_id)
);

create table research.terminology_sources (
  id uuid primary key default uuid_generate_v4(),
  terminology_id uuid not null references research.terminology(id) on delete cascade,
  source_id uuid not null references research.sources(id) on delete cascade,
  page_ref text,
  quote text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (terminology_id, source_id, page_ref)
);

create table research.terminology_people (
  id uuid primary key default uuid_generate_v4(),
  terminology_id uuid not null references research.terminology(id) on delete cascade,
  person_id uuid not null references research.people(id) on delete cascade,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (terminology_id, person_id)
);

create table research.terminology_practices (
  id uuid primary key default uuid_generate_v4(),
  terminology_id uuid not null references research.terminology(id) on delete cascade,
  practice_id uuid not null references research.practices(id) on delete cascade,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (terminology_id, practice_id)
);

create table research.terminology_materials (
  id uuid primary key default uuid_generate_v4(),
  terminology_id uuid not null references research.terminology(id) on delete cascade,
  material_id uuid not null references research.materials(id) on delete cascade,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (terminology_id, material_id)
);

-- Helpful indexes for the common "find everything connected to X" queries
create index idx_material_sources_material on research.material_sources(material_id);
create index idx_material_sources_source on research.material_sources(source_id);
create index idx_practice_sources_practice on research.practice_sources(practice_id);
create index idx_practice_materials_practice on research.practice_materials(practice_id);
create index idx_practice_materials_material on research.practice_materials(material_id);
create index idx_claim_sources_claim on research.claim_sources(claim_id);
create index idx_location_materials_location on research.location_materials(location_id);
