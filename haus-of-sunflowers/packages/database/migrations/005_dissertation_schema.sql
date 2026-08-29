-- =====================================================================
-- 005_dissertation_schema.sql
-- Basic dissertation infrastructure, moved into Phase 1 per revision.
-- Full dashboard/lit-review tooling/versioning stays Phase 2 — this
-- is deliberately minimal but real, so nothing entered now is lost
-- or needs re-entry later.
--
-- IMPORTANT: this schema gets NO grants to anon/authenticated Data
-- API roles at all (see 006_grants.sql). RLS below is a second,
-- independent layer of protection, not the only one.
-- =====================================================================

create table dissertation.projects (
  id uuid primary key default uuid_generate_v4(),
  working_title text not null,
  theoretical_framework text,
  methodology text,
  population_sample text,
  ethics_notes text,
  irb_notes text,
  research_timeline text,
  advisor_feedback text,
  visibility research.visibility_level not null default 'private_dissertation',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table dissertation.research_questions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references dissertation.projects(id) on delete cascade,
  question text not null,
  notes text,
  order_index int,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simple, renamable chapter organization (Section 14: "Chapter 1..5
-- but allow renaming/adding"). Kept intentionally lightweight.
create table dissertation.chapters (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references dissertation.projects(id) on delete cascade,
  name text not null,
  order_index int not null default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table dissertation.notes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references dissertation.projects(id) on delete set null,
  chapter_id uuid references dissertation.chapters(id) on delete set null,
  title text,
  body text not null,
  note_type text, -- 'note' | 'quote' | 'draft_idea' | 'methodology_note' | 'limitation' | 'counterargument' | 'todo'
  theme text,
  visibility research.visibility_level not null default 'private_dissertation',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Links a dissertation note/question to a source in the (shared)
-- research schema, without duplicating the source record.
create table dissertation.source_links (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid references dissertation.notes(id) on delete cascade,
  research_question_id uuid references dissertation.research_questions(id) on delete cascade,
  source_id uuid not null references research.sources(id) on delete cascade,
  page_ref text,
  quote text,
  relevance_note text,
  -- literature-review classification (lightweight version of Section 14;
  -- full theme/theory/gap tooling comes in Phase 2)
  lit_review_role text, -- 'foundational' | 'recent_scholarship' | 'supporting_evidence' | 'contradictory_evidence' | 'research_gap' | 'comparative_source' | null
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (note_id is not null or research_question_id is not null)
);

create table dissertation.claim_links (
  id uuid primary key default uuid_generate_v4(),
  note_id uuid references dissertation.notes(id) on delete cascade,
  research_question_id uuid references dissertation.research_questions(id) on delete cascade,
  claim_id uuid not null references research.claims(id) on delete cascade,
  relevance_note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  check (note_id is not null or research_question_id is not null)
);

-- updated_at triggers
do $$
declare
  t text;
begin
  for t in select unnest(array['projects','research_questions','chapters','notes'])
  loop
    execute format(
      'create trigger trg_%s_updated_at before update on dissertation.%I
       for each row execute function internal.set_updated_at();',
      t, t
    );
  end loop;
end $$;
