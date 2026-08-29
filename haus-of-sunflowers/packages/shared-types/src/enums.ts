/**
 * These types are hand-written to mirror packages/database/migrations
 * exactly. Once a real Supabase project exists, running
 * `supabase gen types typescript` will produce a machine-generated
 * equivalent — at that point these can be replaced or cross-checked
 * against the generated file, but the app can be built against these
 * right now without waiting on that step.
 */

export type VisibilityLevel =
  | "private"
  | "private_dissertation"
  | "embargoed"
  | "internal_research"
  | "member_only"
  | "premium_member"
  | "public_preview"
  | "published_public"
  | "archived";

export type EvidenceClassification =
  | "primary_historical_evidence"
  | "secondary_scholarship"
  | "oral_history"
  | "archival_material"
  | "folklore_collection"
  | "historical_newspaper"
  | "court_record"
  | "government_collection"
  | "dissertation_thesis"
  | "contemporary_practitioner_account"
  | "later_occult_literature"
  | "comparative_diasporic_material"
  | "my_analysis"
  | "my_hypothesis"
  | "unverified";

export type RecordStatus =
  | "verified"
  | "strong_evidence"
  | "moderate_evidence"
  | "preliminary"
  | "unverified"
  | "disputed"
  | "interpretation"
  | "modern_attribution"
  | "needs_further_research";

export type DatePrecision =
  | "exact"
  | "month_year"
  | "year_only"
  | "approximate_year"
  | "date_range"
  | "before_date"
  | "after_date"
  | "circa"
  | "unknown";

export interface HistoricalDate {
  precision: DatePrecision;
  date_value?: string | null;
  range_start?: string | null;
  range_end?: string | null;
  display_text?: string | null;
}

export type LocationPrecision =
  | "exact"
  | "approximate"
  | "county_level"
  | "state_level"
  | "region_level"
  | "unknown";

export type AppRole =
  | "owner"
  | "researcher_editor"
  | "student_member"
  | "public_preview";

export type SourceType =
  | "book"
  | "journal_article"
  | "dissertation"
  | "thesis"
  | "newspaper"
  | "magazine"
  | "government_archive"
  | "folklore_collection"
  | "wpa_record"
  | "oral_history"
  | "interview"
  | "court_record"
  | "census_record"
  | "church_document"
  | "manuscript"
  | "letter"
  | "diary"
  | "photograph"
  | "museum_record"
  | "archive_item"
  | "website"
  | "digital_archive"
  | "recorded_lecture"
  | "field_notes"
  | "other";

export type ClaimStatus =
  | "investigating"
  | "preliminary"
  | "moderate_support"
  | "strong_support"
  | "contested"
  | "rejected"
  | "published_interpretation";

export type InboxStatus =
  | "unprocessed"
  | "reviewing"
  | "needs_source_verification"
  | "needs_citation"
  | "needs_location_verification"
  | "processed"
  | "archived";

export type ClaimStance = "supporting" | "contradicting" | "neutral";

// Import Center ---------------------------------------------------------

/**
 * What KIND of content this is. Kept deliberately separate from
 * EvidenceClassification (below) — a record's content_origin and the
 * evidentiary weight of a specific piece of supporting evidence are
 * two different questions and are never collapsed into one field,
 * either in the database or here.
 */
export type ContentOriginType =
  | "published_hos_content"
  | "historical_source_evidence"
  | "modern_correspondence"
  | "author_interpretation"
  | "unverified";

export type ImportBatchType = "pdf" | "docx" | "pasted_text" | "csv" | "chapter_section";

export type ImportBatchStatus =
  | "uploaded"
  | "parsing"
  | "ready_for_review"
  | "reviewing"
  | "completed"
  | "abandoned";

export type ImportCandidateType =
  | "material"
  | "practice"
  | "source"
  | "source_quote"
  | "correspondence"
  | "claim"
  | "terminology"
  | "research_note"
  | "map_location";

export type ImportCandidateStatus =
  | "pending_review"
  | "needs_info"
  | "approved_created"
  | "approved_merged"
  | "approved_added_evidence"
  | "rejected"
  | "skipped";

export type ImportResolutionType =
  | "create_new"
  | "merge_into_existing"
  | "add_evidence_to_existing"
  | "skip";

export type ImportMatchedEntityType = "material" | "practice" | "source" | "person" | "terminology";

/** Candidate types that support merge/add-evidence in Phase 1 — the
 * rest (source, source_quote, correspondence, research_note,
 * map_location) only support create_new or skip, because they don't
 * yet have a provenance junction table to add evidence into. */
export const MERGEABLE_CANDIDATE_TYPES: ImportCandidateType[] = [
  "material",
  "practice",
  "claim",
  "terminology",
];
