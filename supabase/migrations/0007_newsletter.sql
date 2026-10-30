-- GoodPush — "The Good Weekly" log (one row per week, prevents double sends)
create table if not exists public.newsletter_issues (
  week       date primary key,
  number     int not null,
  phrase_id  text,
  campaigns  jsonb not null default '{}'::jsonb,
  sent_at    timestamptz not null default now()
);
alter table public.newsletter_issues enable row level security;  -- server only
