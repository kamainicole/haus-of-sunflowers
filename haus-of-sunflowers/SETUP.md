# SETUP.md — Running Project Status

This file is kept up to date as we build. Check here any time you want
to know exactly where things stand.

---

## What has been built

- [x] Full architecture review and Phase 1 database design (`docs/architecture.md`)
- [x] 11 numbered SQL migrations, **applied and verified against your live Supabase project**:
      internal/research/dissertation/api schemas, roles, all core
      entities, provenance-carrying junction tables, dissertation
      workspace, schema-level grants, RLS policies, full-text search,
      owner dashboard view, labeled sample data, and a security-hardening
      pass (see "Issues found and fixed" below)
- [x] Monorepo structure (`apps/web`, `packages/database`, `packages/shared-types`)
- [x] Shared TypeScript types mirroring the database schema exactly
- [x] Next.js web app scaffold:
  - Login page (magic-link email auth)
  - Dashboard page (reads live stats from the database)
  - Leaflet map component with the configurable tile provider
  - Supabase client setup (browser, server, and session-refresh middleware)
- [x] Configurable map tile provider — dev-OSM by default, swappable to MapTiler/Stadia/Mapbox/self-hosted via one environment variable
- [x] `.env.example` template (placeholders only) and `apps/web/.env.local` (real values, git-ignored, never committed)
- [x] Backup script (`scripts/backup.sh`)
- [x] Git repository with milestone commits
- [x] **Supabase project connected**: `haus-of-sunflowers` (project ref `vqkvdwwgpgvdyvghxejd`, region us-east-1)
- [x] Security verified directly against the live database:
  - `anon`/`authenticated` roles confirmed to have **zero** privileges on the `dissertation` and `internal` schemas
  - RLS confirmed enabled and enforced on all 30 research tables and all 6 dissertation tables
  - Supabase's security linter run and all warnings resolved (0 remaining)

## Issues found and fixed while applying the migrations

Three real Postgres/Supabase behaviors only surfaced once run against
a live database — worth knowing about, all now fixed and folded back
into the migration files so the repo matches what's actually running:

1. **Full-text search columns needed an explicit `::regconfig` cast.**
   `to_tsvector('english', ...)` isn't recognized as safe for a
   generated column unless the language config is explicitly cast:
   `to_tsvector('english'::regconfig, ...)`.
2. **`array_to_string()` isn't allowed in a generated column.**
   Postgres marks it STABLE rather than IMMUTABLE, even though it's
   safe for plain text arrays. Fixed with a one-line wrapper function,
   `research.immutable_array_to_string()`.
3. **A `UNION ALL` can't be sorted by an output column name directly.**
   The global search function's `ORDER BY rank` needed the unioned
   query wrapped in a subquery with explicit column names first.
4. **Security linter warnings** (all now resolved): four functions
   needed an explicit, fixed `search_path` (a defense against a
   theoretical search-path manipulation attack), and the `pg_trgm`
   extension was moved out of the `public` schema into Supabase's
   dedicated `extensions` schema.

None of these affect the design or the security guarantees described
in `docs/architecture.md` — they're implementation-level fixes, folded
into migrations `008` and a new `011_security_hardening.sql`.

## Known, deliberately deferred items

Supabase's performance advisor flags ~50 "unindexed foreign key"
notices, almost all on `created_by` columns. These are harmless right
now — with a single owner user, filtering by `created_by` essentially
never happens — and are listed here rather than fixed immediately so
Phase 1 doesn't spend time optimizing for query patterns that don't
exist yet. Worth revisiting once Researcher/Editor roles are added
(Phase 3) and "who created this" filtering becomes a real use case.

## Import Center (built and verified)

The full staging/review database and workflow is live and tested
against the real database:

- Upload/paste/CSV → `import.batches` and `import.candidates`
- Automatic duplicate detection on candidate creation (Material,
  Practice, Source, Terminology) via `import.detect_duplicates()`
- `import.promote_candidate()` — the only path into `research.*`,
  gated on your explicit `content_origin` confirmation, tested for
  both the create-new and add-evidence-to-existing paths
- `content_origin` and `evidence_classification` verified to be
  stored as genuinely independent values, never collapsed
- Private `research-files` Storage bucket, owner-only, confirmed non-public
- See `docs/import-center-design.md` for full design + test notes

**Not yet built:** the actual review-screen UI, and the PDF/DOCX
text-extraction step that turns an uploaded file into draft
candidates automatically. Right now the database side is ready to
receive candidates; nothing yet parses a real PDF into them.

## What remains

- [ ] Import Center review-screen UI (upload form, candidate list, duplicate comparison, approve/merge/reject buttons)
- [ ] PDF/DOCX text extraction → candidate generation
- [ ] CSV column-mapping UI
- [ ] Data entry forms: full structured forms for materials, sources, practices, people, locations, terminology, claims, correspondences
- [ ] Research Inbox / Quick Capture UI
- [ ] Global search UI (the database function `research.global_search()` is live and tested — it just needs a search box in the app)
- [ ] Source-reuse in forms (pick an existing source instead of retyping it)
- [ ] Deploy the web app somewhere reachable (Vercel is the recommended choice — not needed until you want to access this outside your own computer)
- [ ] GitHub remote (optional — useful for backup and version history of your *code*, separate from the database backup strategy)
- [ ] Get the `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_URL` values from your Supabase dashboard when you're ready to use `scripts/backup.sh` (not needed for day-to-day app use)

## Services connected so far

| Service | Status |
|---|---|
| Supabase (database, auth, storage) | **Connected.** Project `haus-of-sunflowers`, all 11 migrations applied and verified |
| Vercel (web hosting) | Not started — not needed yet |
| GitHub (code backup) | Not started — optional, not needed yet |

## Environment variables required

| Variable | Needed for | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Connecting the app to your database | **Set** in `apps/web/.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public, RLS-protected database access | **Set** in `apps/web/.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged operations (backups, admin scripts) — never exposed to the browser | Not yet set — only needed for `scripts/backup.sh`, get it from Supabase dashboard → Project Settings → API when you're ready |
| `NEXT_PUBLIC_TILE_PROVIDER` | Which map tile vendor to use | **Set** to `dev-osm` (works out of the box) |

`apps/web/.env.local` holds the real values and is excluded from git
by `.gitignore` — it will never be committed. `.env.example` in the
repo root stays as a placeholder template only.

## How to start the application locally

You'll need Node.js installed first (not yet confirmed on your
machine — let me know if you want a walkthrough for that). Once it's
installed:

```
npm install
npm run dev
```

Then open http://localhost:3000 in your browser. Signing up with your
email there will make you the `owner` automatically (the first user to
sign up always becomes owner — see migration 002).

## How backups work

- **Automatic:** once on Supabase's paid tier, Supabase takes daily
  automated backups of the whole database. (Currently on the free tier.)
- **Manual (recommended in addition):** run `scripts/backup.sh` weekly.
  Requires `SUPABASE_DB_URL`, which isn't set up yet — get it from
  Supabase dashboard → Project Settings → Database → Connection string
  when you're ready.
- **Your own export:** a CSV/JSON export tool for your own research is
  planned for Phase 2.

## What I need from you next

Nothing external right now — the database is fully connected and
verified, and the Import Center's data layer is built and tested.
Next up: the actual review-screen UI and/or the data-entry forms for
materials, sources, practices, etc. Let me know which you'd like
first.
