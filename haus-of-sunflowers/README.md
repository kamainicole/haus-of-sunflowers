# Haus of Sunflowers Research Archive

A private scholarly research environment first, a curated historical
reference archive second, and — eventually — a paid educational
product third. See `docs/architecture.md` for the full architecture
review and rationale, and **`SETUP.md` for the current build status,
what's connected, and what's next** — that file is kept up to date
throughout development.

## Phase 1 scope

Private, owner-only research database covering materials, sources,
practices, people, historical locations, terminology, claims,
correspondences, tags, research notes, a quick-capture inbox, and a
basic dissertation workspace — with the dissertation schema held to a
stricter, database-grant-level standard of isolation than the rest.

## Project structure

```
apps/web/               Next.js application (research workshop UI)
packages/database/      SQL migrations — the source of truth for the schema
packages/shared-types/  TypeScript types shared across web/mobile
supabase/                Supabase project config
docs/                    Architecture documentation
```

## Running the migrations

Migrations in `packages/database/migrations/` are numbered and must
run in order — each one assumes the previous ones already ran.

```
supabase link --project-ref <your-project-ref>
supabase db push
```

This applies, in order:

1. `001_schemas_and_types.sql` — schemas (internal/research/dissertation/api), enums, composite types
2. `002_internal_schema.sql` — user roles, the `is_owner()` helper every policy relies on
3. `003_research_core_tables.sql` — materials, sources, practices, people, locations, terminology, claims, correspondences, notes, inbox, tags
4. `004_research_junctions.sql` — many-to-many relationships, each carrying its own source/page/evidence provenance
5. `005_dissertation_schema.sql` — basic dissertation workspace
6. `006_grants.sql` — schema-level access walls (this is what makes the dissertation schema API-unreachable)
7. `007_rls_policies.sql` — row-level security (owner-only in Phase 1)
8. `008_search.sql` — full-text search across the whole database
9. `009_api_schema.sql` — owner dashboard view
10. `010_seed_sample_data.sql` — **dev-only**, clearly labeled `[SAMPLE]` rows for testing
11. `011_security_hardening.sql` — search_path pinning, pg_trgm moved out of `public`
12. `012_import_schema.sql` — Import Center staging schema (batches, candidates, duplicate matches, candidate links)
13. `013_content_origin_columns.sql` — `content_origin`, kept independent from `evidence_classification`
14. `014_promotion_function.sql` — `import.promote_candidate()`, the only path from staging into real research tables
15. `015_storage_bucket.sql` — private `research-files` bucket for uploads
16. `016_duplicate_detection.sql` — trigram-based duplicate detection, auto-runs on candidate creation

## First-run note

The first user who signs up automatically becomes `owner`
(`internal.handle_new_user()` in migration 002). That should be you,
and only you, in Phase 1 — there's no public signup flow yet.

## Backups

- Daily automated Postgres backups via Supabase (paid tier)
- Weekly manual `pg_dump` to storage you control, independent of Supabase
- A CSV/JSON export tool is planned for Phase 2 so your research is
  never trapped inside the application
