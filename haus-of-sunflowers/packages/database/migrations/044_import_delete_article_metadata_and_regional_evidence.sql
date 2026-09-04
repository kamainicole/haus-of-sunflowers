alter table research.sources
  add column if not exists volume text,
  add column if not exists issue text,
  add column if not exists article_number text,
  add column if not exists publication_date date,
  add column if not exists abstract text,
  add column if not exists keywords text[],
  add column if not exists peer_reviewed boolean;

alter table research.location_materials
  add column if not exists page_ref text,
  add column if not exists quote text,
  add column if not exists evidence_classification research.evidence_classification,
  add column if not exists content_origin research.content_origin_type,
  add column if not exists relationship_basis text,
  add column if not exists native_status text,
  add column if not exists confidence_level text;

alter table research.practice_locations
  add column if not exists page_ref text,
  add column if not exists quote text,
  add column if not exists evidence_classification research.evidence_classification,
  add column if not exists content_origin research.content_origin_type,
  add column if not exists relationship_basis text,
  add column if not exists confidence_level text;

create or replace function api.import_delete_batch(p_batch_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  b import.batches%rowtype;
  promoted_count integer;
  storage_deleted integer := 0;
begin
  if not internal.is_owner() then raise exception 'Not authorized'; end if;
  select * into b from import.batches where id=p_batch_id;
  if not found then raise exception 'Import batch not found'; end if;

  select count(*) into promoted_count from import.candidates
  where batch_id=p_batch_id and status in ('approved_created','approved_merged','approved_added_evidence');

  if b.source_file_path is not null then
    delete from storage.objects
    where bucket_id='research-files' and name=b.source_file_path;
    get diagnostics storage_deleted = row_count;
  end if;

  delete from import.batches where id=p_batch_id;

  return jsonb_build_object(
    'deleted',true,
    'batch_id',p_batch_id,
    'storage_object_deleted',storage_deleted>0,
    'promoted_archive_records_preserved',promoted_count
  );
end;
$$;
revoke all on function api.import_delete_batch(uuid) from public, anon;
grant execute on function api.import_delete_batch(uuid) to authenticated;

create or replace function api.import_create_article_source(
  p_batch_id uuid,
  p_title text,
  p_author text default null,
  p_publication text default null,
  p_publisher text default null,
  p_publication_year integer default null,
  p_publication_date date default null,
  p_volume text default null,
  p_issue text default null,
  p_article_number text default null,
  p_page_range text default null,
  p_doi text default null,
  p_url text default null,
  p_abstract text default null,
  p_keywords text[] default null,
  p_peer_reviewed boolean default true,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  sid uuid;
  b import.batches%rowtype;
begin
  if not internal.is_owner() then raise exception 'Not authorized'; end if;
  select * into b from import.batches where id=p_batch_id;
  if not found then raise exception 'Import batch not found'; end if;

  insert into research.sources(
    source_type,is_primary_source,title,author,publication,publisher,publication_year,publication_date,
    volume,issue,article_number,page_range,doi,url,abstract,keywords,peer_reviewed,file_path,notes,
    content_origin,visibility,created_by
  ) values (
    'journal_article'::research.source_type,false,p_title,p_author,p_publication,p_publisher,p_publication_year,p_publication_date,
    p_volume,p_issue,p_article_number,p_page_range,p_doi,p_url,p_abstract,p_keywords,p_peer_reviewed,b.source_file_path,p_notes,
    'historical_source_evidence'::research.content_origin_type,'internal_research'::research.visibility_level,auth.uid()
  ) returning id into sid;

  update import.batches set linked_source_id=sid, updated_at=now() where id=p_batch_id;
  return sid;
end;
$$;
revoke all on function api.import_create_article_source(uuid,text,text,text,text,integer,date,text,text,text,text,text,text,text,text[],boolean,text) from public, anon;
grant execute on function api.import_create_article_source(uuid,text,text,text,text,integer,date,text,text,text,text,text,text,text,text[],boolean,text) to authenticated;

comment on column research.location_materials.relationship_basis is 'Why a material is associated with a location, e.g. documented_use, native_availability, introduced_availability, trade_access, inferred_correlation.';
comment on column research.location_materials.native_status is 'Plant/material biogeography at this location: native, introduced, cultivated, traded, unknown.';
comment on column research.practice_locations.relationship_basis is 'Why a practice is associated with a location, e.g. directly_documented, informant_location, migration_link, inferred_pattern.';
