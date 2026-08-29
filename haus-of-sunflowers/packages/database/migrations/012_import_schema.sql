-- =====================================================================
-- 012_import_schema.sql
-- Import Center: staging schema for bringing existing research and
-- published material into the database without retyping it, and
-- without anything touching the real research tables until you've
-- explicitly reviewed and approved it.
-- =====================================================================

create schema if not exists import;
comment on schema import is 'Staging area for the Import Center. Nothing here is live research until explicitly promoted.';

-- content_origin lives in `research` (not `import`) because it also
-- gets attached to permanent research records after promotion, per
-- explicit instruction that content_origin and evidence_classification
-- must both be preserved independently on the final record.
create type research.content_origin_type as enum (
  'published_hos_content',
  'historical_source_evidence',
  'modern_correspondence',
  'author_interpretation',
  'unverified'
);

create type import.batch_type as enum ('pdf', 'docx', 'pasted_text', 'csv', 'chapter_section');
create type import.batch_status as enum ('uploaded', 'parsing', 'ready_for_review', 'reviewing', 'completed', 'abandoned');

create type import.candidate_type as enum (
  'material', 'practice', 'source', 'source_quote', 'correspondence',
  'claim', 'terminology', 'research_note', 'map_location'
);

create type import.candidate_status as enum (
  'pending_review', 'needs_info', 'approved_created', 'approved_merged',
  'approved_added_evidence', 'rejected', 'skipped'
);

create type import.resolution_type as enum (
  'create_new', 'merge_into_existing', 'add_evidence_to_existing', 'skip'
);

create type import.matched_entity_type as enum (
  'material', 'practice', 'source', 'person', 'terminology'
);

create table import.batches (
  id uuid primary key default uuid_generate_v4(),
  title text,
  import_type import.batch_type not null,
  source_file_path text,
  original_filename text,
  linked_source_id uuid references research.sources(id),
  status import.batch_status not null default 'uploaded',
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table import.candidates (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid not null references import.batches(id) on delete cascade,
  candidate_type import.candidate_type not null,
  proposed_data jsonb not null default '{}'::jsonb,
  excerpt text,
  page_ref text,
  chapter_section text,
  -- override of batch.linked_source_id, for batches that touch more
  -- than one source (e.g. a CSV of quotes pulled from many books)
  source_id uuid references research.sources(id),

  ai_suggested_origin research.content_origin_type,  -- informational only, never authoritative
  content_origin research.content_origin_type,        -- must be explicitly set by the user
  origin_confirmed_by_user boolean not null default false, -- the actual approval gate

  evidence_classification research.evidence_classification,
  notes text,

  status import.candidate_status not null default 'pending_review',
  resolution import.resolution_type,
  approved_entity_type text,
  approved_entity_id uuid,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,

  -- the actual promotion gate: cannot be approved without an
  -- explicit, user-confirmed content_origin
  constraint chk_origin_confirmed_before_approval check (
    status not in ('approved_created', 'approved_merged', 'approved_added_evidence')
    or (content_origin is not null and origin_confirmed_by_user = true)
  )
);

create index idx_import_candidates_batch on import.candidates(batch_id);
create index idx_import_candidates_status on import.candidates(status);

create table import.duplicate_matches (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references import.candidates(id) on delete cascade,
  matched_entity_type import.matched_entity_type not null,
  matched_entity_id uuid not null,
  match_score real,
  matched_field text,
  created_at timestamptz not null default now()
);

create index idx_import_duplicate_matches_candidate on import.duplicate_matches(candidate_id);

create table import.candidate_links (
  id uuid primary key default uuid_generate_v4(),
  from_candidate_id uuid not null references import.candidates(id) on delete cascade,
  to_candidate_id uuid not null references import.candidates(id) on delete cascade,
  relationship_type text not null, -- e.g. 'uses_material', 'documented_by_source'
  page_ref text,
  quote text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (from_candidate_id <> to_candidate_id)
);

create index idx_import_candidate_links_from on import.candidate_links(from_candidate_id);
create index idx_import_candidate_links_to on import.candidate_links(to_candidate_id);

do $$
declare t text;
begin
  for t in select unnest(array['batches','candidates'])
  loop
    execute format(
      'create trigger trg_%s_updated_at before update on import.%I
       for each row execute function internal.set_updated_at();', t, t
    );
  end loop;
end $$;

-- Same owner-only pattern as research/dissertation: RLS enabled and
-- forced on every table in this schema.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'import'
  loop
    execute format('alter table import.%I enable row level security;', r.tablename);
    execute format('alter table import.%I force row level security;', r.tablename);
    execute format(
      'create policy owner_full_access on import.%I for all
         using (internal.is_owner()) with check (internal.is_owner());',
      r.tablename
    );
  end loop;
end $$;

grant usage on schema import to authenticated;
grant select, insert, update, delete on all tables in schema import to authenticated;
alter default privileges in schema import grant select, insert, update, delete on tables to authenticated;
