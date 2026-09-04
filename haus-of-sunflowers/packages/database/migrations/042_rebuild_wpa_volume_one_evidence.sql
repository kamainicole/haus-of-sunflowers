-- Rebuild WPA Volume I evidence from preserved import excerpts.
-- Removes malformed page-fragment records from the live archive and re-ingests
-- controlled materials/practices/terminology plus exact source quotes.

-- Applied to production as Supabase migration 042_rebuild_wpa_volume_one_evidence.
-- The production migration dynamically resolves the WPA Volume I source by title,
-- processes each distinct preserved excerpt once, and calls
-- import.ingest_lexicon_matches(...) so no generated UUIDs are hardcoded here.
