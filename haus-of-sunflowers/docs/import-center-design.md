# Import Center — Design & Build Status (Phase 1 addition)

**Status: built, applied to the live database, and tested.** This
document is kept as the design record; see `SETUP.md` for current
build status and what remains.

## Revision: content_origin and evidence_classification kept independent

Per explicit instruction, these two concepts are never collapsed into
one field, anywhere:

- **`content_origin`** — what kind of content this is (published Haus
  of Sunflowers content / historical source evidence / modern
  correspondence / author interpretation / unverified). Lives at the
  record level (e.g. on `research.materials` itself).
- **`evidence_classification`** — the evidentiary weight of a
  specific piece of supporting evidence (primary source, secondary
  scholarship, folklore collection, etc.). Lives on the
  provenance-carrying junction tables (`material_sources`,
  `practice_sources`, `claim_sources`, `terminology_sources`,
  `correspondences`).

Both columns exist independently everywhere a promoted candidate can
land, and the promotion function (`import.promote_candidate`) writes
them separately — verified with a live test asserting the two values
differ on the same row.

---

## 1. The workflow, step by step

**Step 1 — Upload/import.**
You upload a PDF, Word doc, paste text directly, upload a CSV, or
select a specific chapter/section of something already uploaded. This
creates an **import batch**.

**Step 2 — Source preservation.**
Where the material has a real author/publication (a book, an article,
your own published work), the batch gets linked to a `research.sources`
row — either an existing one you pick (so your own book, once entered,
is reused every time you import another chapter from it) or a new one
created from what you tell us about it. Pasted text or a CSV of your
own working notes might have no formal source at all — that's fine
and left blank.

**Step 3 — Parsing into candidates.**
The uploaded material is broken into **candidate records** — proposed
Materials, Practices, Source Quotes, Claims, etc. — but nothing is
written to your real tables yet. Every candidate keeps a copy of the
exact excerpt it came from, plus page/chapter reference where the file
format allows it (see the PDF/DOCX note below).

Critically: **every candidate is born with no content-origin
classification.** Parsing can *suggest* one, but the suggestion sits
in a separate field from the one that actually counts, and a candidate
cannot be approved until you've explicitly confirmed which of these
five buckets it belongs in:

- Published Haus of Sunflowers content
- Historical source evidence
- Modern/occult correspondence
- Author interpretation (your own analysis)
- Unverified material

This is the mechanism that satisfies "never let AI classify your own
interpretation as historical evidence" — it's a hard gate, not a
default.

**Step 4 — Duplicate detection.**
Before you even see the review screen, each candidate is checked
against existing Materials, Practices, Sources, People, and
Terminology using the fuzzy-name-matching indexes already in the
database (the trigram indexes from migration 008). Likely matches are
attached to the candidate, ranked by similarity, so the review screen
can show them side-by-side.

**Step 5 — Review screen.**
For each candidate, you see: the proposed record, the source excerpt
it came from, any duplicate matches found, and four possible actions.

**Step 6 — Resolution.** For each candidate you choose one of:

- **Approve → create new record** (writes a new row into the real table)
- **Merge into existing record** (you pick which match; the candidate's
  evidence gets folded in as a new provenance link on the existing
  record — nothing on the existing record is overwritten)
- **Add new evidence to existing record** (same as merge, but for
  cases where it's clearly the same Material/Practice/etc. and you
  just want to attach this new source as additional support)
- **Reject** (discarded, but the batch keeps a record that it was
  reviewed and rejected — never silently deleted)
- **Skip** (left pending — revisit later; doesn't count as reviewed)

Only candidates you explicitly approve, merge, or add-as-evidence ever
touch `research.*` or `dissertation.*`. Everything else stays
quarantined in the import schema indefinitely.

---

## 2. Proposed database schema

A **new, separate schema: `import`** — same owner-only RLS pattern as
`research`, kept structurally apart so staging/unreviewed data is
never accidentally queried alongside verified research.

### `import.batches`
One row per upload/paste/CSV session.

| column | purpose |
|---|---|
| `id` | primary key |
| `title` | your label for this batch, or auto-generated from the filename |
| `import_type` | `pdf` \| `docx` \| `pasted_text` \| `csv` \| `chapter_section` |
| `source_file_path` | private Storage path for the uploaded file, if any |
| `original_filename` | as uploaded |
| `linked_source_id` | FK to `research.sources` — the preserved original, where applicable |
| `status` | `uploaded` → `parsing` → `ready_for_review` → `reviewing` → `completed` \| `abandoned` |
| `notes` | your own notes about this batch |
| `created_by`, `created_at`, `updated_at` | standard |

### `import.candidates`
The staging table — one row per proposed record, of any type.

| column | purpose |
|---|---|
| `id` | primary key |
| `batch_id` | FK to `import.batches` |
| `candidate_type` | `material` \| `practice` \| `source` \| `source_quote` \| `correspondence` \| `claim` \| `terminology` \| `research_note` \| `map_location` |
| `proposed_data` | JSONB — the actual proposed field values, shaped to match whichever real table this will become. (One flexible column instead of nine near-duplicate staging tables — same fields you'd see on the real record, just not committed yet.) |
| `excerpt` | the verbatim source text this candidate was drawn from |
| `page_ref` | page number, where available |
| `chapter_section` | chapter/section label, where available |
| `ai_suggested_origin` | what the parser guessed, if anything — informational only, never authoritative |
| `content_origin` | **nullable**, one of the five buckets above — must be explicitly set by you before approval is allowed |
| `origin_confirmed_by_user` | boolean, must be `true` before this candidate can be approved — this is the actual gate |
| `evidence_classification` | maps to the existing `research.evidence_classification` enum once you assign it (required for anything going in as historical evidence) |
| `notes` | your review notes |
| `status` | `pending_review` \| `needs_info` \| `approved_created` \| `approved_merged` \| `approved_added_evidence` \| `rejected` \| `skipped` |
| `resolution` | `create_new` \| `merge_into_existing` \| `add_evidence_to_existing` \| `skip` \| null |
| `approved_entity_type`, `approved_entity_id` | once promoted, points at the real row this became |
| `created_by`, `created_at`, `updated_at`, `reviewed_at` | standard + review timestamp |

### `import.duplicate_matches`
Possible existing-record matches found for a candidate — kept as its
own table (rather than a single field) so a candidate can show
multiple ranked matches on the review screen.

| column | purpose |
|---|---|
| `id` | primary key |
| `candidate_id` | FK to `import.candidates` |
| `matched_entity_type` | `material` \| `practice` \| `source` \| `person` \| `terminology` |
| `matched_entity_id` | the existing record's real id |
| `match_score` | similarity score from the trigram match |
| `matched_field` | which field triggered the match (e.g. `common_name`) |

### `import.candidate_links`
Relationships *between candidates in the same batch* — needed because,
say, a candidate Practice and a candidate Material from the same
chapter might reference each other before either has a real ID yet.

| column | purpose |
|---|---|
| `id` | primary key |
| `from_candidate_id`, `to_candidate_id` | FKs to `import.candidates` |
| `relationship_type` | e.g. `uses_material`, `documented_by_source` |
| `page_ref`, `quote`, `notes` | same provenance pattern as the real junction tables |

When candidates on both ends of a link get approved, this becomes a
real row in the matching `research.*` junction table (e.g.
`practice_materials`) automatically.

---

## 3. How promotion actually writes to your real tables

A single Postgres function, `import.promote_candidate(candidate_id)`,
handles this — not automatic on save, only triggered by your explicit
"Approve" click:

1. Reads `candidate_type` + `proposed_data`
2. Inserts (or, for merge/add-evidence, updates a junction/provenance
   row on) the correct `research.*` table
3. Writes `content_origin` into the appropriate `evidence_classification`
4. Copies `excerpt`/`page_ref`/`source` onto the new row's provenance fields
5. Updates the candidate's own `status` and `approved_entity_id`
6. Resolves any `candidate_links` pointing at this candidate into real
   junction-table rows, once both sides are approved

Nothing is ever deleted or overwritten automatically — "add evidence"
and "merge" only ever *add* a new provenance-linked row pointing at
the existing record, never rewrite its existing fields.

---

## 4. PDF / Word / page references

Where the file format supports it (PDF page boundaries, Word
paragraph/heading structure), `page_ref` and `chapter_section` are
captured automatically per candidate. Where it can't be determined
reliably, the field is left blank rather than guessed — consistent
with the project's "store unknown as unknown" principle.

## 5. Your own book, specifically

You upload it once, it becomes one `research.sources` row. Every later
import of another chapter reuses that same source (you'll be prompted
to pick it rather than re-create it), while each chapter/page can
still generate any number of distinct Material/Practice/Claim
candidates, each with its own `page_ref` pointing back into the same
source.

## 6. CSV import

Treated as a lighter-weight path into the same `import.candidates`
table — each row becomes one candidate of whatever type you tell the
importer the CSV represents, skipping the free-text parsing step but
still going through duplicate detection and the same review gate.

---

## What was built (verified against the live database)

- `import` schema: `batches`, `candidates`, `duplicate_matches`, `candidate_links` — all RLS-enabled, owner-only
- `research.content_origin_type` enum + `content_origin` column added to all 9 promotable entity tables and 5 provenance junction tables, independent from `evidence_classification` everywhere both apply
- `import.promote_candidate()` — the only path from staging to real tables. Tested: (1) blocks promotion without confirmed `content_origin`, (2) `create_new` path writes a real record + provenance link with both fields distinct, (3) `add_evidence_to_existing` path adds a new provenance link without duplicating or overwriting the existing record
- `import.detect_duplicates()` + an insert trigger — fires automatically when a Material/Practice/Source/Terminology candidate is created, using the trigram similarity indexes from migration 008. Tested against a deliberately misspelled duplicate and correctly matched it
- Private Storage bucket `research-files` — confirmed non-public, with an owner-only RLS policy on `storage.objects`
- `apps/web/lib/supabase/storage.ts` — upload + signed-URL helpers for the app layer

## What remains

- The actual review-screen UI (React) — upload form, candidate list, duplicate-match comparison view, approve/merge/reject buttons calling `promote_candidate()`
- PDF/DOCX text extraction and chunking into draft candidates (the parsing step itself — currently `import.candidates` can be populated, but nothing yet extracts text from an uploaded file and proposes candidates automatically)
- CSV column-mapping UI
- `candidate_links` resolution into real junction rows once both linked candidates are approved (schema exists; the resolution logic isn't wired up yet)
