-- =====================================================================
-- 013_content_origin_columns.sql
-- Adds content_origin as a column independent from
-- evidence_classification, per explicit instruction: the two concepts
-- must never be collapsed into one field.
--
-- content_origin = what kind of content this is (published HOS
--   content / historical evidence / modern correspondence / your own
--   interpretation / unverified) — set once, at the record level.
-- evidence_classification = the evidentiary weight of a specific
--   piece of supporting evidence — already existed on some
--   provenance junction tables; now added to two that were missing it
--   (claim_sources, terminology_sources) so every provenance link
--   can carry both fields, independently, going forward.
-- =====================================================================

-- Record-level content_origin on every entity type the Import Center
-- can create.
alter table research.materials add column content_origin research.content_origin_type;
alter table research.practices add column content_origin research.content_origin_type;
alter table research.sources add column content_origin research.content_origin_type;
alter table research.source_quotes add column content_origin research.content_origin_type;
alter table research.correspondences add column content_origin research.content_origin_type;
alter table research.claims add column content_origin research.content_origin_type;
alter table research.terminology add column content_origin research.content_origin_type;
alter table research.research_notes add column content_origin research.content_origin_type;
alter table research.map_locations add column content_origin research.content_origin_type;

-- Provenance-junction-level content_origin, alongside existing
-- evidence_classification, so a specific piece of evidence linking a
-- record to a source can independently carry both.
alter table research.material_sources add column content_origin research.content_origin_type;
alter table research.practice_sources add column content_origin research.content_origin_type;
alter table research.practice_materials add column content_origin research.content_origin_type;

-- These two junctions never had evidence_classification at all —
-- adding both columns now so claims and terminology can fully
-- support the Import Center's merge/add-evidence resolution path.
alter table research.claim_sources add column evidence_classification research.evidence_classification;
alter table research.claim_sources add column content_origin research.content_origin_type;
alter table research.terminology_sources add column evidence_classification research.evidence_classification;
alter table research.terminology_sources add column content_origin research.content_origin_type;
