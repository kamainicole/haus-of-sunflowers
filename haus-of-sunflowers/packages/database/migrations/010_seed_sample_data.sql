-- =====================================================================
-- 010_seed_sample_data.sql
-- SAMPLE DATA — CLEARLY LABELED, NOT REAL RESEARCH.
-- Every row's title/name is prefixed "[SAMPLE]" so it can never be
-- mistaken for genuine research and is trivially findable/deletable:
--   delete from research.materials where common_name like '[SAMPLE]%';
-- This exists only to verify the schema and relationships work end
-- to end. Run this against a dev database only.
-- =====================================================================

do $$
declare
  v_source_id uuid;
  v_material_id uuid;
  v_practice_id uuid;
  v_location_id uuid;
begin
  insert into research.sources (source_type, is_primary_source, title, author, publication_year, notes, visibility)
  values ('folklore_collection', true, '[SAMPLE] Example Folklore Collection', 'Sample Collector', 1935,
          'Placeholder source for schema testing only — not a real citation.', 'private')
  returning id into v_source_id;

  insert into research.materials (common_name, botanical_name, material_category, documented_use, record_status, visibility)
  values ('[SAMPLE] Example Root', 'Exampla samplea', 'root', 'Placeholder documented use for testing.', 'preliminary', 'private')
  returning id into v_material_id;

  insert into research.practices (name, category, description, visibility)
  values ('[SAMPLE] Example Practice', 'protection', 'Placeholder practice for schema testing only.', 'private')
  returning id into v_practice_id;

  insert into research.map_locations (location_name, state, location_precision, description, visibility)
  values ('[SAMPLE] Example County', 'Mississippi', 'county_level', 'Placeholder map record for testing only.', 'private')
  returning id into v_location_id;

  insert into research.material_sources (material_id, source_id, page_ref, evidence_classification, notes)
  values (v_material_id, v_source_id, 'p. 12', 'folklore_collection', 'Sample provenance link.');

  insert into research.practice_materials (practice_id, material_id, source_id, evidence_classification)
  values (v_practice_id, v_material_id, v_source_id, 'folklore_collection');

  insert into research.correspondences (material_id, correspondence_type, correspondence_value, evidence_classification, notes)
  values (v_material_id, 'planet', 'Mars', 'later_occult_literature',
          'Sample correspondence — explicitly NOT historical evidence, per design.');

  insert into research.tags (name) values ('[SAMPLE] test-tag') on conflict do nothing;

  insert into research.inbox_items (title, raw_note, status)
  values ('[SAMPLE] Example inbox capture', 'Placeholder quick-capture note for testing.', 'unprocessed');
end $$;
