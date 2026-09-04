create or replace function api.regional_material_patterns()
returns table(
  material_id uuid,
  material_name text,
  location_id uuid,
  location_name text,
  city text,
  state text,
  relationship_basis text,
  native_status text,
  page_ref text,
  quote text,
  source_id uuid,
  evidence_classification text,
  confidence_level text
)
language plpgsql
security definer
set search_path=''
as $$
begin
  if not internal.is_owner() then raise exception 'Not authorized'; end if;
  return query
  select m.id,m.common_name,l.id,l.location_name,l.city,l.state,
         lm.relationship_basis,lm.native_status,lm.page_ref,lm.quote,lm.source_id,
         lm.evidence_classification::text,lm.confidence_level
  from research.location_materials lm
  join research.materials m on m.id=lm.material_id
  join research.map_locations l on l.id=lm.location_id
  order by m.common_name,l.state,l.city,l.location_name;
end;
$$;
revoke all on function api.regional_material_patterns() from public, anon;
grant execute on function api.regional_material_patterns() to authenticated;

create or replace function api.regional_practice_patterns()
returns table(
  practice_id uuid,
  practice_name text,
  location_id uuid,
  location_name text,
  city text,
  state text,
  relationship_basis text,
  page_ref text,
  quote text,
  source_id uuid,
  evidence_classification text,
  confidence_level text
)
language plpgsql
security definer
set search_path=''
as $$
begin
  if not internal.is_owner() then raise exception 'Not authorized'; end if;
  return query
  select p.id,p.name,l.id,l.location_name,l.city,l.state,
         pl.relationship_basis,pl.page_ref,pl.quote,pl.source_id,
         pl.evidence_classification::text,pl.confidence_level
  from research.practice_locations pl
  join research.practices p on p.id=pl.practice_id
  join research.map_locations l on l.id=pl.location_id
  order by p.name,l.state,l.city,l.location_name;
end;
$$;
revoke all on function api.regional_practice_patterns() from public, anon;
grant execute on function api.regional_practice_patterns() to authenticated;
