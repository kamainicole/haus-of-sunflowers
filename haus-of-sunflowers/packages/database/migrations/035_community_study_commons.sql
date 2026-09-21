create table if not exists research.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'New Rootworker',
  bio text,
  current_obsession text,
  research_interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  post_type text not null check (post_type in ('question','research_note','source_share','practice_reflection','formula_discussion','historical_finding','compare_discuss','working_share')),
  circle text not null default 'commons' check (circle in ('commons','protection','cleansing','prosperity','love','ancestors','materia','formulation','historical_research')),
  title text not null,
  body text not null,
  source_title text,
  source_author text,
  source_year text,
  page_ref text,
  source_excerpt text,
  interpretation text,
  media_path text,
  media_kind text check (media_kind is null or media_kind in ('image','video')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists research.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references research.community_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists research.community_reactions (
  post_id uuid not null references research.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('notes','curious','changed_mind','sunflower')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction_type)
);

create table if not exists research.community_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table research.community_profiles enable row level security;
alter table research.community_posts enable row level security;
alter table research.community_comments enable row level security;
alter table research.community_reactions enable row level security;
alter table research.community_follows enable row level security;

grant select, insert, update, delete on research.community_profiles to authenticated;
grant select, insert, update, delete on research.community_posts to authenticated;
grant select, insert, update, delete on research.community_comments to authenticated;
grant select, insert, update, delete on research.community_reactions to authenticated;
grant select, insert, update, delete on research.community_follows to authenticated;

create policy "community profiles readable by members" on research.community_profiles for select to authenticated using (true);
create policy "members create own community profile" on research.community_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "members update own community profile" on research.community_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "community posts readable by members" on research.community_posts for select to authenticated using (true);
create policy "members create own posts" on research.community_posts for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "members update own posts" on research.community_posts for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "members delete own posts" on research.community_posts for delete to authenticated using ((select auth.uid()) = author_id);

create policy "community comments readable by members" on research.community_comments for select to authenticated using (true);
create policy "members create own comments" on research.community_comments for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "members update own comments" on research.community_comments for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "members delete own comments" on research.community_comments for delete to authenticated using ((select auth.uid()) = author_id);

create policy "community reactions readable by members" on research.community_reactions for select to authenticated using (true);
create policy "members add own reactions" on research.community_reactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "members remove own reactions" on research.community_reactions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "community follows readable by members" on research.community_follows for select to authenticated using (true);
create policy "members follow as themselves" on research.community_follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "members unfollow as themselves" on research.community_follows for delete to authenticated using ((select auth.uid()) = follower_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media','community-media',false,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy "members can view community media" on storage.objects for select to authenticated using (bucket_id='community-media');
create policy "members upload own community media" on storage.objects for insert to authenticated with check (bucket_id='community-media' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "members update own community media" on storage.objects for update to authenticated using (bucket_id='community-media' and owner_id = (select auth.uid()::text)) with check (bucket_id='community-media' and owner_id = (select auth.uid()::text));
create policy "members delete own community media" on storage.objects for delete to authenticated using (bucket_id='community-media' and owner_id = (select auth.uid()::text));

create index if not exists community_posts_created_idx on research.community_posts(created_at desc);
create index if not exists community_posts_circle_idx on research.community_posts(circle, created_at desc);
create index if not exists community_comments_post_idx on research.community_comments(post_id, created_at);
create index if not exists community_reactions_post_idx on research.community_reactions(post_id);