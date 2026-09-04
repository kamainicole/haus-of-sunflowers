-- One source passage may legitimately describe more than one entity type.
-- When an approved Person candidate also contains a city/state, preserve BOTH:
-- the person record and a linked Historical Map occurrence.

create or replace function import.extract_city_state(p_text text)
returns table(city text, state text)
language plpgsql
immutable
set search_path = ''
as $$
declare
  m text[];
begin
  m := regexp_match(coalesce(p_text,''),
    '(?i)([A-Z][A-Za-z.''’ -]{1,60}),\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)');
  if m is null then return; end if;
  city := btrim(m[1]);
  state := initcap(btrim(m[2]));
  return next;
end;
$$;

create or replace function import.ensure_person_location_from_candidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_city text;
  v_state text;
  v_location_name text;
  v_place_id uuid;
  v_occurrence_id uuid;
  v_person_id uuid;
  v_struct_city text;
  v_struct_state text;
begin
  if new.candidate_type <> 'person'::import.candidate_type then return new; end if;
  if new.status not in ('approved_created','approved_merged','approved_added_evidence') then return new; end if;
  if new.approved_entity_id is null then return new; end if;
  if old.status = new.status and old.approved_entity_id is not distinct from new.approved_entity_id then return new; end if;

  v_person_id := new.approved_entity_id;
  v_struct_city := nullif(btrim(coalesce(new.proposed_data->>'city','')), '');
  v_struct_state := nullif(btrim(coalesce(new.proposed_data->>'state','')), '');

  if v_struct_city is not null and v_struct_state is not null then
    v_city := v_struct_city;
    v_state := v_struct_state;
  else
    select ecs.city, ecs.state into v_city, v_state
    from import.extract_city_state(concat_ws(' ', new.proposed_data->>'location_text', new.proposed_data->>'location', new.excerpt)) ecs
    limit 1;
  end if;

  if v_state is null then return new; end if;

  v_location_name := case when v_city is not null then v_city || ', ' || v_state else v_state end;

  select ml.id into v_place_id
  from research.map_locations ml
  where lower(coalesce(ml.state,'')) = lower(v_state)
    and ((v_city is not null and lower(coalesce(ml.city,'')) = lower(v_city))
      or (v_city is null and ml.city is null and lower(ml.location_name)=lower(v_state)))
  order by ml.created_at limit 1;

  if v_place_id is null then
    insert into research.map_locations(location_name, city, state, location_precision, record_status, content_origin, visibility, created_by)
    values (v_location_name, v_city, v_state,
      case when v_city is not null then 'approximate'::research.location_precision else 'state_level'::research.location_precision end,
      'preliminary'::research.record_status,
      coalesce(new.content_origin,'historical_source_evidence'::research.content_origin_type),
      'private'::research.visibility_level,
      new.created_by)
    returning id into v_place_id;
  end if;

  select lo.id into v_occurrence_id
  from research.location_occurrences lo
  where lo.map_location_id=v_place_id
    and lo.related_person_id=v_person_id
    and lo.source_id is not distinct from new.source_id
    and coalesce(lo.page_ref,'')=coalesce(new.page_ref,'')
  limit 1;

  if v_occurrence_id is null then
    insert into research.location_occurrences(
      map_location_id, source_id, page_ref, excerpt, geographic_precision,
      city, state, related_person_id, evidence_classification, content_origin,
      research_status, notes, visibility, created_by)
    values (
      v_place_id, new.source_id, new.page_ref, new.excerpt,
      case when v_city is not null then 'approximate'::research.location_precision else 'state_level'::research.location_precision end,
      v_city, v_state, v_person_id, new.evidence_classification,
      coalesce(new.content_origin,'historical_source_evidence'::research.content_origin_type),
      'preliminary'::research.record_status,
      concat_ws(E'\n', nullif(new.notes,''), 'Auto-linked from approved person/import evidence.'),
      'private'::research.visibility_level,
      new.created_by)
    returning id into v_occurrence_id;
  end if;

  insert into research.location_people(location_id, person_id, source_id, notes, created_by)
  select v_place_id, v_person_id, new.source_id, 'Auto-linked from approved import evidence.', new.created_by
  where not exists (
    select 1 from research.location_people lp
    where lp.location_id=v_place_id and lp.person_id=v_person_id and lp.source_id is not distinct from new.source_id
  );

  update research.people p
  set location_text=coalesce(nullif(p.location_text,''),v_location_name), updated_at=now()
  where p.id=v_person_id;

  return new;
end;
$$;

drop trigger if exists trg_person_candidate_location_link on import.candidates;
create trigger trg_person_candidate_location_link
after update of status, approved_entity_id on import.candidates
for each row execute function import.ensure_person_location_from_candidate();

-- Backfill existing approved person candidates.
do $$
declare r import.candidates%rowtype;
begin
  for r in select * from import.candidates
    where candidate_type='person'::import.candidate_type
      and status in ('approved_created','approved_merged','approved_added_evidence')
      and approved_entity_id is not null
  loop
    update import.candidates set approved_entity_id=null where id=r.id;
    update import.candidates set approved_entity_id=r.approved_entity_id where id=r.id;
  end loop;
end $$;

revoke execute on function import.extract_city_state(text) from public, anon, authenticated;
revoke execute on function import.ensure_person_location_from_candidate() from public, anon, authenticated;
