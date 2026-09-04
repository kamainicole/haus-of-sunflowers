-- Allow one imported passage to produce multiple reviewable record types.
-- Named informant + explicit city/state become linked Person and Map Location candidates.

create or replace function import.extract_interview_city_state(p_excerpt text)
returns table(city text, state text)
language plpgsql
immutable
set search_path = ''
as $$
declare
  m text[];
begin
  m := regexp_match(
    coalesce(p_excerpt,''),
    '(?i)(?:personal\s+conversation with|interview with)\s+[^—\n]{2,120}\s+—\s+[^,\n]{2,120},\s*([A-Za-z][A-Za-z .''-]{1,60}),\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)'
  );
  if m is null then return; end if;
  city := btrim(m[1]);
  state := btrim(m[2]);
  return next;
end;
$$;

create or replace function import.ensure_companion_review_records(p_candidate_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c import.candidates%rowtype;
  v_subject text;
  v_city text;
  v_state text;
  v_person_candidate uuid;
  v_location_candidate uuid;
  v_location_name text;
begin
  select * into c from import.candidates where id = p_candidate_id;
  if not found then return; end if;
  if c.status = 'skipped'::import.candidate_status then return; end if;

  v_subject := import.extract_interview_subject(c.excerpt);

  if c.candidate_type = 'map_location'::import.candidate_type then
    v_city := nullif(btrim(coalesce(c.proposed_data->>'city','')), '');
    v_state := nullif(btrim(coalesce(c.proposed_data->>'state','')), '');
  end if;

  if v_city is null or v_state is null then
    select ecs.city, ecs.state into v_city, v_state
    from import.extract_interview_city_state(c.excerpt) ecs
    limit 1;
  end if;

  if v_subject is null then
    v_subject := nullif(btrim(coalesce(c.proposed_data->>'_interview_subject','')), '');
  end if;

  if v_subject is null or v_city is null or v_state is null then return; end if;
  v_location_name := v_city || ', ' || v_state;

  select x.id into v_person_candidate
  from import.candidates x
  where x.batch_id = c.batch_id
    and x.candidate_type = 'person'::import.candidate_type
    and coalesce(x.page_ref,'') = coalesce(c.page_ref,'')
    and lower(btrim(coalesce(x.proposed_data->>'full_name',''))) = lower(btrim(v_subject))
  order by x.created_at
  limit 1;

  if v_person_candidate is null then
    insert into import.candidates(
      batch_id, candidate_type, proposed_data, excerpt, page_ref, chapter_section,
      source_id, ai_suggested_origin, content_origin, origin_confirmed_by_user,
      evidence_classification, notes, status, created_by
    ) values (
      c.batch_id, 'person'::import.candidate_type,
      jsonb_build_object(
        'full_name', v_subject,
        'category', 'informant',
        'location_text', v_location_name,
        'city', v_city,
        'state', v_state,
        '_interview_subject', v_subject,
        '_import_confidence', 0.99,
        '_generated_companion', true
      ),
      c.excerpt, c.page_ref, c.chapter_section, c.source_id,
      coalesce(c.ai_suggested_origin,'historical_source_evidence'::research.content_origin_type),
      c.content_origin, c.origin_confirmed_by_user,
      c.evidence_classification,
      concat_ws(E'\n', nullif(c.notes,''), '[AUTO-COMPANION] Person and Historical Location were both documented in this passage.'),
      'pending_review'::import.candidate_status,
      c.created_by
    ) returning id into v_person_candidate;
  else
    update import.candidates
    set proposed_data = proposed_data || jsonb_build_object('location_text',v_location_name,'city',v_city,'state',v_state,'_interview_subject',v_subject),
        updated_at = now()
    where id = v_person_candidate;
  end if;

  select x.id into v_location_candidate
  from import.candidates x
  where x.batch_id = c.batch_id
    and x.candidate_type = 'map_location'::import.candidate_type
    and coalesce(x.page_ref,'') = coalesce(c.page_ref,'')
    and lower(btrim(coalesce(x.proposed_data->>'city',''))) = lower(v_city)
    and lower(btrim(coalesce(x.proposed_data->>'state',''))) = lower(v_state)
  order by x.created_at
  limit 1;

  if v_location_candidate is null then
    insert into import.candidates(
      batch_id, candidate_type, proposed_data, excerpt, page_ref, chapter_section,
      source_id, ai_suggested_origin, content_origin, origin_confirmed_by_user,
      evidence_classification, notes, status, created_by
    ) values (
      c.batch_id, 'map_location'::import.candidate_type,
      jsonb_build_object(
        'location_name', v_location_name,
        'city', v_city,
        'state', v_state,
        'location_precision', 'approximate',
        'practitioner_informant', v_subject,
        '_interview_subject', v_subject,
        '_import_confidence', 0.99,
        '_generated_companion', true
      ),
      c.excerpt, c.page_ref, c.chapter_section, c.source_id,
      coalesce(c.ai_suggested_origin,'historical_source_evidence'::research.content_origin_type),
      c.content_origin, c.origin_confirmed_by_user,
      c.evidence_classification,
      concat_ws(E'\n', nullif(c.notes,''), '[AUTO-COMPANION] Historical Location paired with named informant from the same passage.'),
      'pending_review'::import.candidate_status,
      c.created_by
    ) returning id into v_location_candidate;
  else
    update import.candidates
    set proposed_data = proposed_data || jsonb_build_object('location_name',v_location_name,'city',v_city,'state',v_state,'practitioner_informant',v_subject,'_interview_subject',v_subject),
        status = case when status='skipped'::import.candidate_status then 'pending_review'::import.candidate_status else status end,
        resolution = case when status='skipped'::import.candidate_status then null else resolution end,
        updated_at = now()
    where id = v_location_candidate;
  end if;

  insert into import.candidate_links(from_candidate_id,to_candidate_id,relationship_type,page_ref,quote,notes,created_by)
  select v_person_candidate, v_location_candidate, 'person_at_location', c.page_ref, c.excerpt,
         'Same passage documents the named person and the interview location.', c.created_by
  where not exists (
    select 1 from import.candidate_links l
    where l.from_candidate_id=v_person_candidate and l.to_candidate_id=v_location_candidate and l.relationship_type='person_at_location'
  );
end;
$$;

create or replace function import.sync_companion_review_records()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce((new.proposed_data->>'_generated_companion')::boolean,false) then
    return new;
  end if;
  perform import.ensure_companion_review_records(new.id);
  return new;
end;
$$;

drop trigger if exists trg_sync_companion_review_records on import.candidates;
create trigger trg_sync_companion_review_records
after insert or update of proposed_data, excerpt, page_ref
on import.candidates
for each row execute function import.sync_companion_review_records();

revoke execute on function import.extract_interview_city_state(text) from public, anon, authenticated;
revoke execute on function import.ensure_companion_review_records(uuid) from public, anon, authenticated;
revoke execute on function import.sync_companion_review_records() from public, anon, authenticated;
