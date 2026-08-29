# Haus of Sunflowers Research Archive
## Architecture (Revised) & Final Phase 1 Plan

---

## 1. Map Tile Provider — Now Configurable

Leaflet stays. Tile provider becomes a swappable config value, not a hardcoded URL:

```
apps/web/config/mapTiles.ts
  -> reads TILE_PROVIDER env var (dev-osm | maptiler | stadia | mapbox | self-hosted)
  -> returns { url, attribution, maxZoom } for whichever is active
```

Every map component reads from this config, never from a hardcoded tile URL. Development uses free OSM-compatible tiles; production can point at MapTiler, Stadia, Mapbox, or a self-hosted tile server later by changing one environment variable — no code changes, no rewrite.

---

## 2. Database Schema Architecture — Explained in Plain English

Think of this as four rooms in a building, each with a different lock:

**`internal` schema** — the building's own utility closet. User profiles, roles. Nothing in here is ever queried directly by the app's public-facing code.

**`research` schema** — your working Hoodoo research: materials, sources, practices, people, locations, claims, terminology, correspondences, notes, inbox. Protected by Row-Level Security (RLS). Right now, RLS says "only the owner can read or write anything here." Later, when member tiers exist, RLS policies will be extended (not replaced) to allow specific visibility levels through.

**`dissertation` schema** — your dissertation research. Same RLS-owner-only protection as `research`, **plus** a second, independent layer: this schema is never granted API access at all. Concretely, the `authenticated` and `anon` Postgres roles that Supabase's auto-generated Data API uses get **no GRANT** on the `dissertation` schema whatsoever. Even if an RLS policy were ever misconfigured, there is no door into this schema from the public API layer — the walls themselves don't connect. Only server-side code running with elevated (service-role) credentials, which only you control, can reach it.

**`api` schema** — a thin, deliberate layer of views. This is the *only* thing the public API is allowed to see, and right now (Phase 1) it's essentially empty since there are no public/member users yet. When Phase 3 adds member access, this schema will contain curated views like `api.published_materials` that select only rows where `visibility = 'published_public'` from `research.materials`. The app never lets outside users query `research.*` or `dissertation.*` directly — they only ever see `api.*`.

**Why both RLS and schema-level grants, not just RLS?**
RLS is a policy — a rule that *can* have a bug. Schema-level grants are a wall — there's no rule to get wrong because there's no path to walk down. For ordinary research data, RLS alone is fine (and is what most Supabase apps use). For dissertation material specifically, given how strongly you weighted this, you get both: the wall (no grant) and the rule (RLS), so a single mistake in either layer isn't enough to expose it.

---

## 3. Dissertation — Basic Infrastructure Moved to Phase 1

Minimal but real, not a placeholder:

- `dissertation.projects`
- `dissertation.research_questions`
- `dissertation.notes`
- `dissertation.source_links` (links a note/question to a `research.sources` row, with page/context)
- `dissertation.claim_links` (links to `research.claims`)
- `dissertation.chapters` (simple: name, order, notes — renamable/addable)
- Tagging reuses the shared `research.taggings` polymorphic table (a tag is a tag regardless of which schema owns the tagged thing)

Dashboard, literature-review classification tooling, versioning, and analytics remain Phase 2 — the data model just needs to exist now so nothing you enter today has to be re-entered later.

---

## 4. Terminology — Moved to Phase 1

`research.terminology` with alternate spellings, historical/modern meaning, quoted usage, source/page, date range, and links to people/practices/materials/locations — as specified. Full-text searchable from day one.

---

## 5. Research Inbox / Quick Capture — Added to Phase 1

`research.inbox_items` — a low-friction capture table (raw note, URL, source guess, quote, file, approximate date/location, tags, processing status). Converting an inbox item to a structured record **copies** data into the new record and marks the inbox item `processed` with a link to what it became — the original capture is never deleted automatically, exactly as specified.

---

## 6–7. Correspondence & Source-Level Provenance

Both `research.correspondences` and every junction/relationship table (e.g. `material_sources`, `practice_materials`) carry their own `source_id`, `page`, `quote`, `evidence_classification`, and `notes` columns. A relationship like "Material X used in Practice Y" is never a bare link — it's a link plus the evidence for it. This is the design decision that makes the whole database defensible as scholarship rather than a glorified tag cloud.

---

## 8. Data Portability

All primary keys are standard UUIDs. No Supabase-specific functions are used in core business logic — only standard Postgres (RLS, triggers, constraints) and application-layer TypeScript. A `pg_dump` at any time is a complete, faithful copy of your research, provenance included.

---

## FINAL PHASE 1 ENTITY ARCHITECTURE

### `internal` schema
- `user_profiles` (id → auth.users, role: owner | researcher | member | public)

### `research` schema
**Core entities:** `materials`, `sources`, `source_quotes`, `practices`, `people`, `map_locations`, `claims`, `correspondences`, `terminology`, `tags`, `taggings` (polymorphic), `research_notes`, `inbox_items`

**Provenance-carrying junctions:** `material_sources`, `practice_sources`, `practice_materials`, `practice_people`, `practice_locations`, `person_sources`, `location_sources`, `location_materials`, `location_people`, `claim_sources`, `claim_materials`, `claim_practices`, `claim_people`, `terminology_sources`, `terminology_people`, `terminology_practices`, `terminology_materials`

### `dissertation` schema
`projects`, `research_questions`, `notes`, `source_links`, `claim_links`, `chapters`

### `api` schema
Empty in Phase 1 except a placeholder owner-only dashboard view (`api.dashboard_stats`) — structure exists, content stays owner-only until Phase 3.

---

## Explicitly Deferred (per instruction)
Subscriptions, member access, mobile apps, AI features, knowledge graph, advanced visualization, research trails, scripture database, version history, audit log, citation export UI.

---

Proceeding to repository scaffold and migrations now.
