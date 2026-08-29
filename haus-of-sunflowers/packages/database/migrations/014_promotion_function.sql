-- =====================================================================
-- 014_promotion_function.sql
-- import.promote_candidate() — the only path by which staged import
-- data ever reaches the real research tables. Runs only when you
-- explicitly approve/merge/add-evidence on the review screen; never
-- automatic, never triggered by parsing or duplicate detection.
--
-- Hard rule enforced here (in addition to the check constraint on
-- import.candidates): content_origin must be explicitly confirmed by
-- you before anything is written. evidence_classification and
-- content_origin are always written to separate columns — never
-- combined, per explicit instruction.
--
-- Note on a bug found and fixed during testing: a CASE expression
-- returning untyped string literals into an enum column does NOT get
-- the same automatic type inference a plain literal gets. Every enum
-- value assigned via CASE below is explicitly cast (e.g.
-- `(... )::import.candidate_status`) — omitting this throws
-- "column is of type X but expression is of type text" at runtime,
-- only surfaced by actually exercising the merge/add-evidence path.
-- =====================================================================

create or replace function import.promote_candidate(
  p_candidate_id uuid,
  p_resolution import.resolution_type,
  p_existing_entity_id uuid default null
)
returns table (entity_type text, entity_id uuid)
language plpgsql
security invoker
set search_path = research, import, pg_catalog, pg_temp
as $$
declare
  c import.candidates%rowtype;
  d jsonb;
  new_id uuid;
begin
  select * into c from import.candidates where id = p_candidate_id;
  if not found then
    raise exception 'Candidate % not found', p_candidate_id;
  end if;

  if c.status in ('approved_created','approved_merged','approved_added_evidence') then
    raise exception 'Candidate % has already been promoted', p_candidate_id;
  end if;

  if p_resolution = 'skip' then
    update import.candidates
      set status = 'skipped'::import.candidate_status, resolution = 'skip', reviewed_at = now(), updated_at = now()
      where id = p_candidate_id;
    return query select c.candidate_type::text, null::uuid;
    return;
  end if;

  -- The actual gate: no promotion without your explicit, confirmed
  -- content_origin. This mirrors the check constraint on the table,
  -- checked again here so the error is clear regardless of how this
  -- function gets called.
  if p_resolution in ('create_new','merge_into_existing','add_evidence_to_existing')
     and (c.content_origin is null or c.origin_confirmed_by_user is not true) then
    raise exception 'content_origin must be explicitly confirmed (origin_confirmed_by_user = true) before promotion';
  end if;

  d := c.proposed_data;

  if p_resolution = 'create_new' then
    case c.candidate_type

      when 'material' then
        insert into research.materials (
          common_name, botanical_name, scientific_name, material_category,
          documented_use, my_analysis, record_status, content_origin,
          visibility, created_by
        ) values (
          d->>'common_name', d->>'botanical_name', d->>'scientific_name', d->>'material_category',
          d->>'documented_use', d->>'my_analysis', coalesce((d->>'record_status')::research.record_status, 'preliminary'),
          c.content_origin, 'private', c.created_by
        ) returning id into new_id;
        if c.source_id is not null then
          insert into research.material_sources (
            material_id, source_id, page_ref, quote, evidence_classification, content_origin, notes, created_by
          ) values (
            new_id, c.source_id, c.page_ref, c.excerpt, c.evidence_classification, c.content_origin, c.notes, c.created_by
          );
        end if;

      when 'practice' then
        insert into research.practices (
          name, category, description, my_analysis, record_status, content_origin, visibility, created_by
        ) values (
          d->>'name', d->>'category', d->>'description', d->>'my_analysis',
          coalesce((d->>'record_status')::research.record_status, 'preliminary'),
          c.content_origin, 'private', c.created_by
        ) returning id into new_id;
        if c.source_id is not null then
          insert into research.practice_sources (
            practice_id, source_id, page_ref, quote, evidence_classification, content_origin, notes, created_by
          ) values (
            new_id, c.source_id, c.page_ref, c.excerpt, c.evidence_classification, c.content_origin, c.notes, c.created_by
          );
        end if;

      when 'source' then
        insert into research.sources (
          source_type, is_primary_source, title, author, publisher, publication_year,
          notes, content_origin, visibility, created_by
        ) values (
          coalesce((d->>'source_type')::research.source_type, 'other'),
          (d->>'is_primary_source')::boolean, d->>'title', d->>'author', d->>'publisher',
          (d->>'publication_year')::int, d->>'notes', c.content_origin, 'private', c.created_by
        ) returning id into new_id;

      when 'source_quote' then
        insert into research.source_quotes (
          source_id, quote, page, speaker, context, interpretation, content_origin, visibility, created_by
        ) values (
          coalesce(c.source_id, (d->>'source_id')::uuid), coalesce(c.excerpt, d->>'quote'),
          coalesce(c.page_ref, d->>'page'), d->>'speaker', d->>'context', d->>'interpretation',
          c.content_origin, 'private', c.created_by
        ) returning id into new_id;

      when 'correspondence' then
        insert into research.correspondences (
          material_id, correspondence_type, correspondence_value, tradition_context,
          evidence_classification, content_origin, source_id, page_ref, notes, visibility, created_by
        ) values (
          (d->>'material_id')::uuid, d->>'correspondence_type', d->>'correspondence_value', d->>'tradition_context',
          coalesce(c.evidence_classification, 'later_occult_literature'), c.content_origin,
          c.source_id, c.page_ref, c.notes, 'private', c.created_by
        ) returning id into new_id;

      when 'claim' then
        insert into research.claims (
          claim_title, claim_statement, topic, my_analysis, content_origin, visibility, created_by
        ) values (
          d->>'claim_title', d->>'claim_statement', d->>'topic', d->>'my_analysis',
          c.content_origin, 'private', c.created_by
        ) returning id into new_id;
        if c.source_id is not null then
          insert into research.claim_sources (
            claim_id, source_id, stance, page_ref, quote, evidence_classification, content_origin, notes, created_by
          ) values (
            new_id, c.source_id, coalesce(d->>'stance', 'neutral'), c.page_ref, c.excerpt,
            c.evidence_classification, c.content_origin, c.notes, c.created_by
          );
        end if;

      when 'terminology' then
        insert into research.terminology (
          term, historical_meaning, modern_meaning, quoted_usage, region, period,
          interpretation_notes, content_origin, visibility, created_by
        ) values (
          d->>'term', d->>'historical_meaning', d->>'modern_meaning', coalesce(c.excerpt, d->>'quoted_usage'),
          d->>'region', d->>'period', d->>'interpretation_notes', c.content_origin, 'private', c.created_by
        ) returning id into new_id;
        if c.source_id is not null then
          insert into research.terminology_sources (
            terminology_id, source_id, page_ref, quote, evidence_classification, content_origin, notes, created_by
          ) values (
            new_id, c.source_id, c.page_ref, c.excerpt, c.evidence_classification, c.content_origin, c.notes, c.created_by
          );
        end if;

      when 'research_note' then
        insert into research.research_notes (
          title, body, related_entity_type, related_entity_id, content_origin, visibility, created_by
        ) values (
          d->>'title', coalesce(c.excerpt, d->>'body'), d->>'related_entity_type',
          (d->>'related_entity_id')::uuid, c.content_origin, 'private', c.created_by
        ) returning id into new_id;

      when 'map_location' then
        insert into research.map_locations (
          location_name, city, county, state, region, latitude, longitude,
          location_precision, description, content_origin, visibility, created_by
        ) values (
          d->>'location_name', d->>'city', d->>'county', d->>'state', d->>'region',
          (d->>'latitude')::double precision, (d->>'longitude')::double precision,
          coalesce((d->>'location_precision')::research.location_precision, 'unknown'),
          coalesce(c.excerpt, d->>'description'), c.content_origin, 'private', c.created_by
        ) returning id into new_id;

    end case;

    update import.candidates set
      status = 'approved_created'::import.candidate_status, resolution = 'create_new',
      approved_entity_type = c.candidate_type::text, approved_entity_id = new_id,
      reviewed_at = now(), updated_at = now()
    where id = p_candidate_id;

    return query select c.candidate_type::text, new_id;

  elsif p_resolution in ('merge_into_existing','add_evidence_to_existing') then
    if p_existing_entity_id is null then
      raise exception 'p_existing_entity_id is required for %', p_resolution;
    end if;

    case c.candidate_type
      when 'material' then
        insert into research.material_sources (
          material_id, source_id, page_ref, quote, evidence_classification, content_origin, notes, created_by
        ) values (
          p_existing_entity_id, c.source_id, c.page_ref, c.excerpt, c.evidence_classification, c.content_origin, c.notes, c.created_by
        );
      when 'practice' then
        insert into research.practice_sources (
          practice_id, source_id, page_ref, quote, evidence_classification, content_origin, notes, created_by
        ) values (
          p_existing_entity_id, c.source_id, c.page_ref, c.excerpt, c.evidence_classification, c.content_origin, c.notes, c.created_by
        );
      when 'claim' then
        insert into research.claim_sources (
          claim_id, source_id, stance, page_ref, quote, evidence_classification, content_origin, notes, created_by
        ) values (
          p_existing_entity_id, c.source_id, coalesce(d->>'stance','neutral'), c.page_ref, c.excerpt,
          c.evidence_classification, c.content_origin, c.notes, c.created_by
        );
      when 'terminology' then
        insert into research.terminology_sources (
          terminology_id, source_id, page_ref, quote, evidence_classification, content_origin, notes, created_by
        ) values (
          p_existing_entity_id, c.source_id, c.page_ref, c.excerpt, c.evidence_classification, c.content_origin, c.notes, c.created_by
        );
      else
        raise exception
          'candidate_type % does not support merge/add-evidence in Phase 1 — only create_new or skip. (source, source_quote, correspondence, research_note, and map_location records do not yet have a provenance junction table to merge additional evidence into.)',
          c.candidate_type;
    end case;

    update import.candidates set
      status = (case when p_resolution = 'merge_into_existing' then 'approved_merged' else 'approved_added_evidence' end)::import.candidate_status,
      resolution = p_resolution,
      approved_entity_type = c.candidate_type::text, approved_entity_id = p_existing_entity_id,
      reviewed_at = now(), updated_at = now()
    where id = p_candidate_id;

    return query select c.candidate_type::text, p_existing_entity_id;
  end if;
end;
$$;

comment on function import.promote_candidate is
  'The only path from staged import data to the real research tables. Requires content_origin to be explicitly confirmed. Never overwrites existing records — merge/add-evidence only ever inserts a new provenance-linked row.';
