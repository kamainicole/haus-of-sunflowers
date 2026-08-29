-- =====================================================================
-- 016_duplicate_detection.sql
-- Runs automatically whenever a candidate is created (via trigger),
-- using the trigram similarity indexes already built in migration
-- 008. Populates import.duplicate_matches so the review screen can
-- show "this looks like an existing record" before you decide what
-- to do with it. Never blocks or auto-resolves anything — purely
-- informational until you choose merge/add-evidence/create/skip.
--
-- Tested against the live database with a deliberately misspelled
-- duplicate ("High John Conqueror Root" vs. an existing "High John
-- the Conqueror Root") — correctly caught by trigram similarity.
-- =====================================================================

create or replace function import.detect_duplicates(
  p_candidate_id uuid,
  p_threshold real default 0.3,
  p_max_matches int default 5
)
returns setof import.duplicate_matches
language plpgsql
security invoker
set search_path = research, import, extensions, pg_catalog, pg_temp
as $$
declare
  c import.candidates%rowtype;
  d jsonb;
  v_name text;
begin
  select * into c from import.candidates where id = p_candidate_id;
  if not found then
    raise exception 'Candidate % not found', p_candidate_id;
  end if;
  d := c.proposed_data;

  delete from import.duplicate_matches where candidate_id = p_candidate_id;

  if c.candidate_type = 'material' then
    v_name := d->>'common_name';
    if v_name is not null then
      insert into import.duplicate_matches (candidate_id, matched_entity_type, matched_entity_id, match_score, matched_field)
      select p_candidate_id, 'material', id, similarity(common_name, v_name), 'common_name'
      from research.materials
      where similarity(common_name, v_name) >= p_threshold
      order by similarity(common_name, v_name) desc
      limit p_max_matches;
    end if;

  elsif c.candidate_type = 'practice' then
    v_name := d->>'name';
    if v_name is not null then
      insert into import.duplicate_matches (candidate_id, matched_entity_type, matched_entity_id, match_score, matched_field)
      select p_candidate_id, 'practice', id, similarity(name, v_name), 'name'
      from research.practices
      where similarity(name, v_name) >= p_threshold
      order by similarity(name, v_name) desc
      limit p_max_matches;
    end if;

  elsif c.candidate_type = 'source' then
    v_name := d->>'title';
    if v_name is not null then
      insert into import.duplicate_matches (candidate_id, matched_entity_type, matched_entity_id, match_score, matched_field)
      select p_candidate_id, 'source', id, similarity(title, v_name), 'title'
      from research.sources
      where similarity(title, v_name) >= p_threshold
      order by similarity(title, v_name) desc
      limit p_max_matches;
    end if;

  elsif c.candidate_type = 'terminology' then
    v_name := d->>'term';
    if v_name is not null then
      insert into import.duplicate_matches (candidate_id, matched_entity_type, matched_entity_id, match_score, matched_field)
      select p_candidate_id, 'terminology', id, similarity(term, v_name), 'term'
      from research.terminology
      where similarity(term, v_name) >= p_threshold
      order by similarity(term, v_name) desc
      limit p_max_matches;
    end if;
  end if;
  -- No candidate_type creates a standalone Person record in Phase 1,
  -- so no person-matching branch here — 'person' remains a valid
  -- matched_entity_type for future use (e.g. a Material candidate
  -- whose practitioner_informant text matches an existing Person).

  return query select * from import.duplicate_matches where candidate_id = p_candidate_id;
end;
$$;

comment on function import.detect_duplicates is
  'Populates import.duplicate_matches using trigram similarity. Purely informational — never blocks or auto-resolves a candidate.';

create or replace function import.trg_detect_duplicates_on_insert()
returns trigger
language plpgsql
security invoker
set search_path = import, pg_temp
as $$
begin
  if new.candidate_type in ('material','practice','source','terminology') then
    perform import.detect_duplicates(new.id);
  end if;
  return new;
end;
$$;

create trigger trg_candidates_detect_duplicates
  after insert on import.candidates
  for each row execute function import.trg_detect_duplicates_on_insert();
