-- =====================================================================
-- 008_search.sql
-- Global search (Section 17), Phase 1 version: Postgres full-text
-- search via generated tsvector columns + GIN indexes. No external
-- search service needed yet — this scales comfortably into the
-- tens of thousands of records you're planning for.
--
-- Two Postgres quirks worth knowing about (found while applying this
-- against the real database, not obvious from reading the SQL):
--
-- 1. to_tsvector('english', ...) needs the config explicitly cast —
--    to_tsvector('english'::regconfig, ...) — or Postgres refuses to
--    treat it as IMMUTABLE and won't allow it in a generated column.
-- 2. array_to_string() is marked STABLE, not IMMUTABLE, in Postgres,
--    so it can't be used directly in a generated column either even
--    though it's perfectly safe for plain text[] columns. The fix is
--    a one-line IMMUTABLE wrapper function (below).
-- =====================================================================

-- Standard, widely-used workaround for array_to_string's STABLE
-- marking — see note above.
create or replace function research.immutable_array_to_string(arr text[], sep text)
returns text
language sql
immutable
parallel safe
as $$
  select array_to_string(arr, sep);
$$;

alter table research.materials add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(common_name,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(botanical_name,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, research.immutable_array_to_string(coalesce(folk_names,'{}'), ' ')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(documented_use,'')), 'C') ||
    setweight(to_tsvector('english'::regconfig, coalesce(my_analysis,'')), 'D')
  ) stored;

alter table research.sources add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(author,'')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(notes,'')), 'D')
  ) stored;

alter table research.practices add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(name,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(description,'')), 'C')
  ) stored;

alter table research.people add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(full_name,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, research.immutable_array_to_string(coalesce(alternate_names,'{}'), ' ')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(biography,'')), 'D')
  ) stored;

alter table research.terminology add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(term,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, research.immutable_array_to_string(coalesce(alternate_spellings,'{}'), ' ')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(historical_meaning,'')), 'C')
  ) stored;

alter table research.claims add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(claim_title,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(claim_statement,'')), 'B')
  ) stored;

alter table research.map_locations add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(location_name,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(description,'')), 'C')
  ) stored;

alter table research.research_notes add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(body,'')), 'B')
  ) stored;

alter table research.inbox_items add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english'::regconfig, coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(raw_note,'')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(quote_excerpt,'')), 'C')
  ) stored;

create index idx_materials_search on research.materials using gin (search_vector);
create index idx_sources_search on research.sources using gin (search_vector);
create index idx_practices_search on research.practices using gin (search_vector);
create index idx_people_search on research.people using gin (search_vector);
create index idx_terminology_search on research.terminology using gin (search_vector);
create index idx_claims_search on research.claims using gin (search_vector);
create index idx_map_locations_search on research.map_locations using gin (search_vector);
create index idx_research_notes_search on research.research_notes using gin (search_vector);
create index idx_inbox_items_search on research.inbox_items using gin (search_vector);

-- Trigram indexes support fuzzy/typo-tolerant matching for names,
-- useful for duplicate detection (Section 35) as well as search.
create index idx_materials_common_name_trgm on research.materials using gin (common_name gin_trgm_ops);
create index idx_people_full_name_trgm on research.people using gin (full_name gin_trgm_ops);
create index idx_sources_title_trgm on research.sources using gin (title gin_trgm_ops);
create index idx_terminology_term_trgm on research.terminology using gin (term gin_trgm_ops);

-- A single cross-entity search function the app calls once, rather
-- than querying each table separately. RLS on each underlying table
-- still applies since this function is NOT security definer.
-- Note: the UNION ALL below is wrapped in a subquery with explicit
-- column aliases (`combined(...)`) because Postgres won't let
-- `ORDER BY rank` see through a bare UNION ALL's column names —
-- found while applying this migration, not obvious from the SQL alone.
create or replace function research.global_search(query text, max_results int default 25)
returns table (
  entity_type text,
  entity_id uuid,
  title text,
  snippet text,
  rank real
)
language sql
stable
as $$
  select * from (
    select 'material'::text, id, common_name, coalesce(documented_use, my_analysis, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.materials where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
    union all
    select 'source', id, title, coalesce(notes, citation, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.sources where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
    union all
    select 'practice', id, name, coalesce(description, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.practices where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
    union all
    select 'person', id, full_name, coalesce(biography, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.people where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
    union all
    select 'terminology', id, term, coalesce(historical_meaning, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.terminology where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
    union all
    select 'claim', id, claim_title, coalesce(claim_statement, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.claims where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
    union all
    select 'map_location', id, location_name, coalesce(description, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.map_locations where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
    union all
    select 'research_note', id, coalesce(title, ''), coalesce(body, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.research_notes where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
    union all
    select 'inbox_item', id, coalesce(title, ''), coalesce(raw_note, ''), ts_rank(search_vector, websearch_to_tsquery('english'::regconfig, query))
    from research.inbox_items where search_vector @@ websearch_to_tsquery('english'::regconfig, query)
  ) as combined(entity_type, entity_id, title, snippet, rank)
  order by rank desc
  limit max_results;
$$;
