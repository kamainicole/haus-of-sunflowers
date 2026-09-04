-- Manual review is exception-only. Raw parser guesses are preserved as evidence inputs
-- and auto-skipped unless explicitly marked _curated=true. High-confidence structural
-- person/location ingestion happens before this guard.

create or replace function import.force_exception_only_review()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
begin
  if new.candidate_type in ('material','practice','terminology','map_location')
     and coalesce(new.proposed_data->>'_curated','false') <> 'true'
     and new.status not in ('approved_created','approved_merged','approved_added_evidence') then
    new.status := 'skipped'::import.candidate_status;
    new.resolution := 'skip'::import.resolution_type;
    new.notes := concat_ws(E'\n',nullif(new.notes,''),'[AUTO-SKIPPED] Raw parser proposal. Evidence-first pipeline preserves relevant source evidence and only sends true exceptions to manual review.');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_zzz_exception_only_review on import.candidates;
create trigger trg_zzz_exception_only_review
before insert on import.candidates
for each row execute function import.force_exception_only_review();

revoke execute on function import.force_exception_only_review() from public,anon,authenticated;
