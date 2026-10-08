-- 051_student_member_access.sql
-- Owner-managed student access for the Haus of Sunflowers app.
-- Students may use the research/formulary app, but never the dissertation,
-- import/upload workspace, or owner administration.

create table if not exists internal.student_access (
  email text primary key,
  display_name text,
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table internal.student_access is
  'Owner-managed allowlist for student_member access. Not exposed directly through the Data API.';

drop trigger if exists trg_student_access_updated_at on internal.student_access;
create trigger trg_student_access_updated_at
  before update on internal.student_access
  for each row execute function internal.set_updated_at();

revoke all on table internal.student_access from anon, authenticated;

create or replace function research.am_i_student()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select role = 'student_member'::internal.app_role
       from internal.user_profiles
      where id = auth.uid()),
    false
  );
$$;

revoke execute on function research.am_i_student() from public, anon;
grant execute on function research.am_i_student() to authenticated;

-- New invited users become students automatically.
create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_first_user boolean;
  is_invited_student boolean;
  assigned_role internal.app_role;
begin
  select not exists(select 1 from internal.user_profiles) into is_first_user;

  select exists(
    select 1
      from internal.student_access
     where lower(email) = lower(coalesce(new.email, ''))
       and active = true
  ) into is_invited_student;

  assigned_role :=
    case
      when is_first_user then 'owner'::internal.app_role
      when is_invited_student then 'student_member'::internal.app_role
      else 'public_preview'::internal.app_role
    end;

  insert into internal.user_profiles (id, role, display_name)
  values (
    new.id,
    assigned_role,
    case
      when is_invited_student then (
        select display_name
          from internal.student_access
         where lower(email) = lower(coalesce(new.email, ''))
         limit 1
      )
      else null
    end
  );

  return new;
end;
$$;

revoke execute on function internal.handle_new_user() from public, anon, authenticated;

-- Public check used only by the dedicated Student Access sign-in screen.
create or replace function api.student_access_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
      from internal.student_access
     where lower(email) = lower(trim(p_email))
       and active = true
  );
$$;

revoke execute on function api.student_access_allowed(text) from public;
grant execute on function api.student_access_allowed(text) to anon, authenticated;

create or replace function api.owner_add_student(p_email text, p_display_name text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not internal.is_owner() then
    raise exception 'owner access required';
  end if;

  if nullif(trim(p_email), '') is null then
    raise exception 'student email is required';
  end if;

  insert into internal.student_access (email, display_name, active, created_by)
  values (lower(trim(p_email)), nullif(trim(p_display_name), ''), true, auth.uid())
  on conflict (email) do update
    set display_name = excluded.display_name,
        active = true,
        updated_at = now();

  update internal.user_profiles p
     set role = 'student_member'::internal.app_role,
         display_name = coalesce(nullif(trim(p_display_name), ''), p.display_name),
         updated_at = now()
    from auth.users u
   where p.id = u.id
     and lower(u.email) = lower(trim(p_email))
     and p.role <> 'owner'::internal.app_role;
end;
$$;

revoke execute on function api.owner_add_student(text,text) from public, anon;
grant execute on function api.owner_add_student(text,text) to authenticated;

create or replace function api.owner_remove_student(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not internal.is_owner() then
    raise exception 'owner access required';
  end if;

  update internal.student_access
     set active = false, updated_at = now()
   where lower(email) = lower(trim(p_email));

  update internal.user_profiles p
     set role = 'public_preview'::internal.app_role,
         updated_at = now()
    from auth.users u
   where p.id = u.id
     and lower(u.email) = lower(trim(p_email))
     and p.role = 'student_member'::internal.app_role;
end;
$$;

revoke execute on function api.owner_remove_student(text) from public, anon;
grant execute on function api.owner_remove_student(text) to authenticated;

create or replace function api.owner_list_students()
returns table (
  email text,
  display_name text,
  active boolean,
  account_status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.email,
    s.display_name,
    s.active,
    case
      when u.id is null then 'invited'
      when p.role = 'student_member'::internal.app_role then 'active'
      else 'not_active'
    end as account_status,
    s.created_at
  from internal.student_access s
  left join auth.users u on lower(u.email) = lower(s.email)
  left join internal.user_profiles p on p.id = u.id
  where internal.is_owner()
  order by s.active desc, coalesce(s.display_name, s.email);
$$;

revoke execute on function api.owner_list_students() from public, anon;
grant execute on function api.owner_list_students() to authenticated;

-- Student read access to the app's research/reference layer.
-- Owner private working notes and quick-capture inbox stay owner-only.
do $$
declare
  t text;
begin
  foreach t in array array[
    'sources','source_quotes','materials','correspondences','practices',
    'people','map_locations','terminology','claims','tags','taggings',
    'material_sources','practice_sources','practice_materials','practice_people',
    'practice_locations','person_sources','location_sources','location_materials',
    'location_people','claim_sources','claim_materials','claim_practices',
    'claim_people','terminology_sources','terminology_people',
    'terminology_practices','terminology_materials',
    'material_roles','material_temperaments','material_applications',
    'material_relationships'
  ]
  loop
    if to_regclass('research.' || t) is not null then
      execute format('drop policy if exists student_read_access on research.%I', t);
      execute format(
        'create policy student_read_access on research.%I for select using (research.am_i_student())',
        t
      );
    end if;
  end loop;
end $$;

-- Student formulas are private to the student, while published/sample formulas
-- remain readable as learning material.
drop policy if exists student_formula_select on research.formulas;
create policy student_formula_select on research.formulas
  for select
  using (
    research.am_i_student()
    and (
      created_by = auth.uid()
      or is_sample_formula = true
      or visibility in (
        'internal_research',
        'member_only',
        'premium_member',
        'public_preview',
        'published_public'
      )
    )
  );

drop policy if exists student_formula_insert on research.formulas;
create policy student_formula_insert on research.formulas
  for insert
  with check (
    research.am_i_student()
    and created_by = auth.uid()
  );

drop policy if exists student_formula_update on research.formulas;
create policy student_formula_update on research.formulas
  for update
  using (research.am_i_student() and created_by = auth.uid())
  with check (research.am_i_student() and created_by = auth.uid());

drop policy if exists student_formula_delete on research.formulas;
create policy student_formula_delete on research.formulas
  for delete
  using (research.am_i_student() and created_by = auth.uid());

drop policy if exists student_formula_ingredient_select on research.formula_ingredients;
create policy student_formula_ingredient_select on research.formula_ingredients
  for select
  using (
    research.am_i_student()
    and exists (
      select 1 from research.formulas f
       where f.id = formula_id
         and (
           f.created_by = auth.uid()
           or f.is_sample_formula = true
           or f.visibility in (
             'internal_research','member_only','premium_member','public_preview','published_public'
           )
         )
    )
  );

drop policy if exists student_formula_ingredient_insert on research.formula_ingredients;
create policy student_formula_ingredient_insert on research.formula_ingredients
  for insert
  with check (
    research.am_i_student()
    and created_by = auth.uid()
    and exists (
      select 1 from research.formulas f
       where f.id = formula_id
         and f.created_by = auth.uid()
    )
  );

drop policy if exists student_formula_ingredient_update on research.formula_ingredients;
create policy student_formula_ingredient_update on research.formula_ingredients
  for update
  using (
    research.am_i_student()
    and created_by = auth.uid()
    and exists (
      select 1 from research.formulas f
       where f.id = formula_id
         and f.created_by = auth.uid()
    )
  )
  with check (
    research.am_i_student()
    and created_by = auth.uid()
  );

drop policy if exists student_formula_ingredient_delete on research.formula_ingredients;
create policy student_formula_ingredient_delete on research.formula_ingredients
  for delete
  using (
    research.am_i_student()
    and created_by = auth.uid()
    and exists (
      select 1 from research.formulas f
       where f.id = formula_id
         and f.created_by = auth.uid()
    )
  );

drop policy if exists student_formula_journal_access on research.formula_journal;
create policy student_formula_journal_access on research.formula_journal
  for all
  using (
    research.am_i_student()
    and created_by = auth.uid()
    and exists (
      select 1 from research.formulas f
       where f.id = formula_id
         and f.created_by = auth.uid()
    )
  )
  with check (
    research.am_i_student()
    and created_by = auth.uid()
    and exists (
      select 1 from research.formulas f
       where f.id = formula_id
         and f.created_by = auth.uid()
    )
  );

-- Explicitly keep private working tables closed to students.
-- Existing owner_full_access policies remain untouched.
drop policy if exists student_read_access on research.research_notes;
drop policy if exists student_read_access on research.inbox_items;

-- No grants are added to dissertation or import schemas.
-- Import Center, owner admin, and dissertation routes also enforce owner checks.
