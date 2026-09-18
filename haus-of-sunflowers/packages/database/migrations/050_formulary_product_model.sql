-- 050_formulary_product_model.sql
-- Extends the research model so the app can function as an interactive
-- extension of The Root Worker's Formulary rather than an herb-only archive.

alter table research.materials
  add column if not exists material_type text,
  add column if not exists material_subtype text,
  add column if not exists aroma_profile text,
  add column if not exists formulation_behavior text,
  add column if not exists safety_notes text,
  add column if not exists shelf_life_notes text,
  add column if not exists preparation_notes text;

create table if not exists research.material_roles (
  id uuid primary key default extensions.uuid_generate_v4(),
  material_id uuid not null references research.materials(id) on delete cascade,
  role_name text not null,
  condition_context text,
  application_context text,
  rationale text,
  source_id uuid references research.sources(id) on delete set null,
  page_ref text,
  quote text,
  content_origin research.content_origin_type,
  evidence_classification research.evidence_classification,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'internal_research',
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research.material_temperaments (
  id uuid primary key default extensions.uuid_generate_v4(),
  material_id uuid not null references research.materials(id) on delete cascade,
  dimension text not null,
  value text not null,
  context text,
  notes text,
  source_id uuid references research.sources(id) on delete set null,
  page_ref text,
  content_origin research.content_origin_type,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'internal_research',
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research.material_applications (
  id uuid primary key default extensions.uuid_generate_v4(),
  material_id uuid not null references research.materials(id) on delete cascade,
  application_type text not null,
  suitability text,
  behavior text,
  preparation_method text,
  concentration_or_ratio text,
  cautions text,
  source_id uuid references research.sources(id) on delete set null,
  page_ref text,
  quote text,
  content_origin research.content_origin_type,
  evidence_classification research.evidence_classification,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'internal_research',
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research.material_relationships (
  id uuid primary key default extensions.uuid_generate_v4(),
  source_material_id uuid not null references research.materials(id) on delete cascade,
  target_material_id uuid not null references research.materials(id) on delete cascade,
  relationship_type text not null,
  condition_context text,
  application_context text,
  source_role text,
  target_role text,
  rationale text,
  source_id uuid references research.sources(id) on delete set null,
  page_ref text,
  quote text,
  content_origin research.content_origin_type,
  evidence_classification research.evidence_classification,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'internal_research',
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_material_id <> target_material_id)
);

create table if not exists research.formulas (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  formula_type text,
  condition_name text not null,
  desired_outcome text,
  description text,
  temperament_summary text,
  balance_assessment text,
  application_method text,
  sequence_notes text,
  source_id uuid references research.sources(id) on delete set null,
  page_ref text,
  content_origin research.content_origin_type,
  evidence_classification research.evidence_classification,
  record_status research.record_status not null default 'preliminary',
  visibility research.visibility_level not null default 'internal_research',
  is_sample_formula boolean not null default false,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research.formula_ingredients (
  id uuid primary key default extensions.uuid_generate_v4(),
  formula_id uuid not null references research.formulas(id) on delete cascade,
  material_id uuid not null references research.materials(id) on delete restrict,
  role_name text,
  amount_text text,
  proportion numeric,
  sequence_order integer,
  rationale text,
  preparation_notes text,
  source_id uuid references research.sources(id) on delete set null,
  page_ref text,
  quote text,
  content_origin research.content_origin_type,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research.formula_journal (
  id uuid primary key default extensions.uuid_generate_v4(),
  formula_id uuid not null references research.formulas(id) on delete cascade,
  used_on date,
  condition_snapshot text,
  application_notes text,
  observations text,
  outcome_notes text,
  follow_up_date date,
  visibility research.visibility_level not null default 'private',
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_roles_material_idx on research.material_roles(material_id);
create index if not exists material_roles_role_idx on research.material_roles(lower(role_name));
create index if not exists material_temperaments_material_idx on research.material_temperaments(material_id);
create index if not exists material_applications_material_idx on research.material_applications(material_id);
create index if not exists material_applications_type_idx on research.material_applications(lower(application_type));
create index if not exists material_relationships_source_idx on research.material_relationships(source_material_id);
create index if not exists material_relationships_target_idx on research.material_relationships(target_material_id);
create index if not exists formulas_condition_idx on research.formulas(lower(condition_name));
create index if not exists formula_ingredients_formula_idx on research.formula_ingredients(formula_id);
create index if not exists formula_ingredients_material_idx on research.formula_ingredients(material_id);

alter table research.material_roles enable row level security;
alter table research.material_temperaments enable row level security;
alter table research.material_applications enable row level security;
alter table research.material_relationships enable row level security;
alter table research.formulas enable row level security;
alter table research.formula_ingredients enable row level security;
alter table research.formula_journal enable row level security;

create policy owner_full_access on research.material_roles for all using (internal.is_owner()) with check (internal.is_owner());
create policy owner_full_access on research.material_temperaments for all using (internal.is_owner()) with check (internal.is_owner());
create policy owner_full_access on research.material_applications for all using (internal.is_owner()) with check (internal.is_owner());
create policy owner_full_access on research.material_relationships for all using (internal.is_owner()) with check (internal.is_owner());
create policy owner_full_access on research.formulas for all using (internal.is_owner()) with check (internal.is_owner());
create policy owner_full_access on research.formula_ingredients for all using (internal.is_owner()) with check (internal.is_owner());
create policy owner_full_access on research.formula_journal for all using (internal.is_owner()) with check (internal.is_owner());

grant select, insert, update, delete on research.material_roles to authenticated;
grant select, insert, update, delete on research.material_temperaments to authenticated;
grant select, insert, update, delete on research.material_applications to authenticated;
grant select, insert, update, delete on research.material_relationships to authenticated;
grant select, insert, update, delete on research.formulas to authenticated;
grant select, insert, update, delete on research.formula_ingredients to authenticated;
grant select, insert, update, delete on research.formula_journal to authenticated;
