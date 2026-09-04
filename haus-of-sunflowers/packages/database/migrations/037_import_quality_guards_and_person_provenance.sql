-- Import quality guards: suppress administrative/front-matter proposals,
-- normalize obvious interview-heading person records, and ensure approved people
-- are linked back to their source.

create or replace function import.is_admin_front_matter(p_excerpt text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_excerpt,'') ~* 'project gutenberg license|this ebook is for the use of anyone anywhere at no cost|terms of use|trademark|copyright notice|full project gutenberg license|end of (the )?project gutenberg|produced by the online distributed proofreading team';
$$;

create or replace function import.extract_interview_subject(p_excerpt text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare m text[];
begin
  m := regexp_match(coalesce(p_excerpt,''), '(?i)(?:personal\s+)?interview with\s+([^—\n]{2,100}?)(?:\s+—|\n|$)');
  if m is null then return null; end if;
  return btrim(m[1]);
end;
$$;

create or replace function import.has_research_relevance(p_excerpt text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(p_excerpt,'') ~* '(hoodoo|conju|conjer|root ?work|rootworker|witch|ha[’'' ]?nt|haint|ghost|spirit|charm|mojo|trick|omen|dream|fortune|spell|folk medicine|home[- ]made medicine|remed(y|ies)|herb|boneset|bone-set|mullen|mullein|jimson|sassafras|wash ?pot|bible back|brush arbor|conjure bag|dime with (a )?hole|sifter|horse ?shoe|graveyard|cemetery|healing|prayer meeting|baptis|church|religion)';
$$;

create or replace function import.candidate_quality_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subject text;
  v_label text;
  v_word_count int;
begin
  if import.is_admin_front_matter(new.excerpt) then
    new.status := 'skipped'::import.candidate_status;
    new.resolution := 'skip'::import.resolution_type;
    new.notes := concat_ws(E'\n', nullif(new.notes,''), '[AUTO-SKIPPED] Administrative/front-matter page; retained in document view but excluded from research extraction.');
    new.proposed_data := coalesce(new.proposed_data,'{}'::jsonb) || jsonb_build_object('_page_classification','administrative_front_matter','_import_confidence',1.0);
    return new;
  end if;

  v_subject := import.extract_interview_subject(new.excerpt);
  if v_subject is not null then
    new.proposed_data := coalesce(new.proposed_data,'{}'::jsonb) || jsonb_build_object('_interview_subject',v_subject);
  end if;

  if new.candidate_type = 'person'::import.candidate_type and v_subject is not null and length(v_subject) <= 80 and v_subject !~ ',' then
    new.proposed_data := coalesce(new.proposed_data,'{}'::jsonb)
      || jsonb_build_object('full_name',v_subject,'category','informant','_import_confidence',0.99,'_extraction_basis','interview_heading');
  end if;

  if new.candidate_type = 'person'::import.candidate_type then
    v_label := coalesce(new.proposed_data->>'full_name','');
  elsif new.candidate_type = 'map_location'::import.candidate_type then
    v_label := coalesce(new.proposed_data->>'location_name','');
  elsif new.candidate_type = 'material'::import.candidate_type then
    v_label := coalesce(new.proposed_data->>'common_name','');
  elsif new.candidate_type = 'practice'::import.candidate_type then
    v_label := coalesce(new.proposed_data->>'name','');
  elsif new.candidate_type = 'terminology'::import.candidate_type then
    v_label := coalesce(new.proposed_data->>'term','');
  else
    v_label := '';
  end if;

  v_word_count := case when btrim(v_label)='' then 0 else cardinality(regexp_split_to_array(btrim(v_label),'\s+')) end;

  if new.candidate_type in ('person','map_location','material','practice','terminology')
     and v_subject is null
     and not import.has_research_relevance(new.excerpt)
     and (
       v_label ~* '^[ivxlcdm]+\s+' or
       v_word_count > 10 or
       length(v_label) > 100 or
       v_label ~* '^(name unknown|unknown)$'
     ) then
    new.status := 'skipped'::import.candidate_status;
    new.resolution := 'skip'::import.resolution_type;
    new.notes := concat_ws(E'\n', nullif(new.notes,''), '[AUTO-SKIPPED] Low-confidence page fragment, not a reliable structured record.');
    new.proposed_data := coalesce(new.proposed_data,'{}'::jsonb) || jsonb_build_object('_import_confidence',0.05,'_suppression_reason','malformed_page_fragment');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_candidate_quality_guard on import.candidates;
create trigger trg_candidate_quality_guard
before insert or update of proposed_data, excerpt, candidate_type
on import.candidates
for each row execute function import.candidate_quality_guard();

create or replace function import.link_approved_person_to_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.candidate_type = 'person'::import.candidate_type
     and new.status in ('approved_created','approved_merged','approved_added_evidence')
     and new.approved_entity_id is not null
     and new.source_id is not null
     and (old.status is distinct from new.status or old.approved_entity_id is distinct from new.approved_entity_id) then
    insert into research.person_sources(person_id, source_id, page_ref, quote, notes, created_by)
    select new.approved_entity_id, new.source_id, new.page_ref, new.excerpt,
           concat_ws(E'\n', nullif(new.notes,''), 'Imported person provenance.'), new.created_by
    where not exists (
      select 1 from research.person_sources ps
      where ps.person_id=new.approved_entity_id and ps.source_id=new.source_id and coalesce(ps.page_ref,'')=coalesce(new.page_ref,'')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_link_approved_person_to_source on import.candidates;
create trigger trg_link_approved_person_to_source
after update of status, approved_entity_id
on import.candidates
for each row execute function import.link_approved_person_to_source();

create or replace function api.import_list_candidates(p_batch_id uuid)
returns table(id uuid, candidate_type text, proposed_data jsonb, excerpt text, page_ref text, chapter_section text, source_id uuid, ai_suggested_origin text, content_origin text, origin_confirmed_by_user boolean, evidence_classification text, notes text, status text, resolution text, approved_entity_type text, approved_entity_id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not internal.is_owner() then raise exception 'Not authorized'; end if;
  return query
    select c.id, c.candidate_type::text, c.proposed_data, c.excerpt, c.page_ref,
           c.chapter_section, c.source_id, c.ai_suggested_origin::text, c.content_origin::text,
           c.origin_confirmed_by_user, c.evidence_classification::text, c.notes,
           c.status::text, c.resolution::text, c.approved_entity_type, c.approved_entity_id,
           c.created_at
    from import.candidates c
    where c.batch_id = p_batch_id
      and c.status <> 'skipped'::import.candidate_status
    order by c.created_at;
end;
$$;

revoke execute on function import.is_admin_front_matter(text) from public, anon, authenticated;
revoke execute on function import.extract_interview_subject(text) from public, anon, authenticated;
revoke execute on function import.has_research_relevance(text) from public, anon, authenticated;
revoke execute on function import.candidate_quality_guard() from public, anon, authenticated;
revoke execute on function import.link_approved_person_to_source() from public, anon, authenticated;
