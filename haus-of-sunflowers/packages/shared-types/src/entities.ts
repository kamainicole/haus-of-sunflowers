import type {
  VisibilityLevel,
  EvidenceClassification,
  RecordStatus,
  HistoricalDate,
  LocationPrecision,
  SourceType,
  ClaimStatus,
  InboxStatus,
  ContentOriginType,
  ImportBatchType,
  ImportBatchStatus,
  ImportCandidateType,
  ImportCandidateStatus,
  ImportResolutionType,
  ImportMatchedEntityType,
} from "./enums";

interface BaseRecord {
  id: string;
  visibility: VisibilityLevel;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Source extends BaseRecord {
  source_type: SourceType;
  is_primary_source: boolean | null;
  title: string;
  author: string | null;
  editor: string | null;
  publication: string | null;
  publisher: string | null;
  publication_year: number | null;
  original_date: HistoricalDate | null;
  collection_date: string | null;
  url: string | null;
  doi: string | null;
  isbn: string | null;
  archive_name: string | null;
  collection_name: string | null;
  box_ref: string | null;
  folder_ref: string | null;
  document_number: string | null;
  interview_number: string | null;
  page_range: string | null;
  location_text: string | null;
  citation: string | null;
  reliability_notes: string | null;
  copyright_notes: string | null;
  file_path: string | null;
  external_link: string | null;
  notes: string | null;
  content_origin: ContentOriginType | null;
}

export interface SourceQuote extends BaseRecord {
  source_id: string;
  quote: string;
  page: string | null;
  speaker: string | null;
  context: string | null;
  interpretation: string | null;
  publication_permission: boolean;
  content_origin: ContentOriginType | null;
}

export interface Material extends BaseRecord {
  common_name: string;
  botanical_name: string | null;
  scientific_name: string | null;
  historical_names: string[] | null;
  folk_names: string[] | null;
  regional_names: string[] | null;
  alternate_spellings: string[] | null;
  plant_family: string | null;
  material_category: string | null;
  part_used: string | null;
  geographic_origin: string | null;
  native_range: string | null;
  introduced_range: string | null;
  documented_use: string | null;
  practice_category: string | null;
  historical_period: HistoricalDate | null;
  earliest_source_documented: HistoricalDate | null;
  location_documented: string | null;
  practitioner_informant: string | null;
  collector_researcher: string | null;
  historical_terminology: string | null;
  preparation_method: string | null;
  application_method: string | null;
  my_analysis: string | null;
  personal_observations: string | null;
  questions: string | null;
  hypotheses: string | null;
  contradictory_information: string | null;
  leads_to_investigate: string | null;
  record_status: RecordStatus;
  content_origin: ContentOriginType | null;
}

export interface Correspondence extends BaseRecord {
  material_id: string;
  correspondence_type: string;
  correspondence_value: string;
  tradition_context: string | null;
  evidence_classification: EvidenceClassification;
  source_id: string | null;
  page_ref: string | null;
  historical_period: HistoricalDate | null;
  notes: string | null;
  record_status: RecordStatus;
  content_origin: ContentOriginType | null;
}

export interface Practice extends BaseRecord {
  name: string;
  category: string | null;
  description: string | null;
  historical_period: HistoricalDate | null;
  my_analysis: string | null;
  record_status: RecordStatus;
}

export interface Person extends BaseRecord {
  full_name: string | null;
  alternate_names: string[] | null;
  nicknames: string[] | null;
  historical_terminology_for_them: string | null;
  category: string | null;
  birth_date: HistoricalDate | null;
  death_date: HistoricalDate | null;
  location_text: string | null;
  biography: string | null;
  role: string | null;
  communities: string[] | null;
  identity_certainty: string | null;
  reliability_notes: string | null;
  notes: string | null;
  record_status: RecordStatus;
}

// Note: Person does not currently receive content_origin — the Import
// Center's candidate_type list does not include a standalone "person"
// candidate in Phase 1 (only used as a duplicate-match target).

export interface MapLocation extends BaseRecord {
  location_name: string;
  city: string | null;
  county: string | null;
  state: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: LocationPrecision;
  historical_location_name: string | null;
  modern_location_name: string | null;
  event_date: HistoricalDate | null;
  historical_period: string | null;
  practice_documented: string | null;
  material_documented: string | null;
  practitioner_informant: string | null;
  description: string | null;
  research_notes: string | null;
  record_status: RecordStatus;
  content_origin: ContentOriginType | null;
}

export interface TerminologyEntry extends BaseRecord {
  term: string;
  alternate_spellings: string[] | null;
  historical_meaning: string | null;
  modern_meaning: string | null;
  quoted_usage: string | null;
  earliest_documented_usage: HistoricalDate | null;
  region: string | null;
  period: string | null;
  interpretation_notes: string | null;
  record_status: RecordStatus;
  content_origin: ContentOriginType | null;
}

export interface Claim extends BaseRecord {
  claim_title: string;
  claim_statement: string;
  topic: string | null;
  status: ClaimStatus;
  confidence_level: string | null;
  my_analysis: string | null;
  questions: string | null;
  methodological_concerns: string | null;
  alternative_explanations: string | null;
  dissertation_relevance: string | null;
  time_period: HistoricalDate | null;
  content_origin: ContentOriginType | null;
}

export interface ResearchNote extends BaseRecord {
  title: string | null;
  body: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  content_origin: ContentOriginType | null;
}

export interface InboxItem extends BaseRecord {
  title: string | null;
  raw_note: string | null;
  url: string | null;
  source_title_guess: string | null;
  author_guess: string | null;
  page_guess: string | null;
  quote_excerpt: string | null;
  file_path: string | null;
  approximate_location: string | null;
  approximate_date: string | null;
  status: InboxStatus;
  converted_to_entity_type: string | null;
  converted_to_entity_id: string | null;
  captured_at: string;
}

export interface Tag {
  id: string;
  name: string;
  normalized_name: string;
  created_by: string | null;
  created_at: string;
}

export interface Tagging {
  id: string;
  tag_id: string;
  entity_type: string;
  entity_id: string;
  created_by: string | null;
  created_at: string;
}

// Provenance-carrying junction record shape, reused conceptually
// across material_sources / practice_sources / claim_sources /
// terminology_sources / etc. evidence_classification and
// content_origin are kept as two separate optional fields — never
// collapsed into one — mirroring the database columns exactly.
export interface ProvenanceLink {
  id: string;
  source_id: string | null;
  page_ref: string | null;
  quote: string | null;
  evidence_classification?: EvidenceClassification | null;
  content_origin?: ContentOriginType | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DissertationProject {
  id: string;
  working_title: string;
  theoretical_framework: string | null;
  methodology: string | null;
  population_sample: string | null;
  ethics_notes: string | null;
  irb_notes: string | null;
  research_timeline: string | null;
  advisor_feedback: string | null;
  visibility: VisibilityLevel;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DissertationChapter {
  id: string;
  project_id: string;
  name: string;
  order_index: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DissertationNote {
  id: string;
  project_id: string | null;
  chapter_id: string | null;
  title: string | null;
  body: string;
  note_type: string | null;
  theme: string | null;
  visibility: VisibilityLevel;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Import Center ---------------------------------------------------------

export interface ImportBatch {
  id: string;
  title: string | null;
  import_type: ImportBatchType;
  source_file_path: string | null;
  original_filename: string | null;
  linked_source_id: string | null;
  status: ImportBatchStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A staged candidate record, not yet written to research.* or
 * dissertation.*. proposed_data holds the actual field values, shaped
 * like a partial version of whichever real entity this will become
 * (Material, Practice, Source, etc.) once approved.
 *
 * content_origin and evidence_classification are two independent
 * fields by design — see the comment on ContentOriginType. A
 * candidate cannot be approved (see MERGEABLE_CANDIDATE_TYPES and the
 * database's own check constraint) until content_origin is set AND
 * origin_confirmed_by_user is true — ai_suggested_origin is a hint,
 * never authoritative.
 */
export interface ImportCandidate {
  id: string;
  batch_id: string;
  candidate_type: ImportCandidateType;
  proposed_data: Record<string, unknown>;
  excerpt: string | null;
  page_ref: string | null;
  chapter_section: string | null;
  source_id: string | null;

  ai_suggested_origin: ContentOriginType | null;
  content_origin: ContentOriginType | null;
  origin_confirmed_by_user: boolean;

  evidence_classification: EvidenceClassification | null;
  notes: string | null;

  status: ImportCandidateStatus;
  resolution: ImportResolutionType | null;
  approved_entity_type: string | null;
  approved_entity_id: string | null;

  created_by: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

export interface ImportDuplicateMatch {
  id: string;
  candidate_id: string;
  matched_entity_type: ImportMatchedEntityType;
  matched_entity_id: string;
  match_score: number | null;
  matched_field: string | null;
  created_at: string;
}

export interface ImportCandidateLink {
  id: string;
  from_candidate_id: string;
  to_candidate_id: string;
  relationship_type: string;
  page_ref: string | null;
  quote: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_sources: number;
  total_materials: number;
  total_map_records: number;
  total_claims: number;
  total_people: number;
  total_practices: number;
  total_dissertation_notes: number;
  claims_needing_verification: number;
  cited_claim_links: number;
  new_materials_this_month: number;
  new_sources_this_month: number;
  private_records_materials: number;
  published_records_materials: number;
}
