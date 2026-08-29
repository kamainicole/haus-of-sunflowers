-- =====================================================================
-- 015_storage_bucket.sql
-- Private storage bucket for Import Center uploads (PDFs, Word docs,
-- images, scans, screenshots) and any other research file uploads.
-- Not public — nothing here is reachable by URL guessing; access is
-- owner-only, same RLS pattern as the database tables.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('research-files', 'research-files', false)
on conflict (id) do nothing;

create policy "owner_full_access_research_files"
on storage.objects
for all
using (bucket_id = 'research-files' and internal.is_owner())
with check (bucket_id = 'research-files' and internal.is_owner());
