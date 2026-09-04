-- Stabilize companion review-record detection on long OCR/transcribed pages.

create or replace function import.extract_interview_subject(p_excerpt text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  t text;
  low_t text;
  pos int;
  rest text;
  dash_pos int;
  nl_pos int;
  candidate text;
begin
  t := left(coalesce(p_excerpt,''), 1200);
  low_t := lower(t);
  pos := position('interview with ' in low_t);
  if pos = 0 then
    pos := position('personal conversation with ' in low_t);
    if pos > 0 then
      rest := substr(t, pos + length('personal conversation with '));
    else
      return null;
    end if;
  else
    rest := substr(t, pos + length('interview with '));
  end if;

  dash_pos := position('—' in rest);
  nl_pos := position(E'\n' in rest);

  if dash_pos > 0 then
    candidate := left(rest, dash_pos - 1);
  elsif nl_pos > 0 then
    candidate := left(rest, nl_pos - 1);
  else
    candidate := left(rest, 100);
  end if;

  candidate := btrim(candidate, ' -–—:;');
  if candidate = '' or length(candidate) > 100 then return null; end if;
  return candidate;
end;
$$;

create or replace function import.extract_interview_city_state(p_excerpt text)
returns table(city text, state text)
language plpgsql
immutable
set search_path = ''
as $$
declare
  t text;
  low_t text;
  pos int;
  segment text;
begin
  t := left(coalesce(p_excerpt,''), 1600);
  low_t := lower(t);
  pos := position('interview with ' in low_t);
  if pos = 0 then pos := position('personal conversation with ' in low_t); end if;
  if pos = 0 then return; end if;

  segment := substr(t, pos, 500);
  return query select ecs.city, ecs.state from import.extract_city_state(segment) ecs limit 1;
end;
$$;

drop trigger if exists trg_sync_companion_review_records on import.candidates;
create trigger trg_sync_companion_review_records
after insert on import.candidates
for each row execute function import.sync_companion_review_records();
