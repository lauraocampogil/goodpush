-- GoodPush — feedback, notification pause / weekdays, email marketing sync
-- Run after 0003_accounts.sql

-- In-app feedback (also sent to Sentry User Feedback)
create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  device_id   text,
  user_id     uuid references auth.users(id) on delete set null,
  rating      smallint check (rating between 1 and 5),
  kind        text check (kind in ('idea', 'problem', 'love', 'other')),
  message     text not null check (char_length(message) between 1 and 2000),
  email       text,
  lang        text,
  page        text,
  premium     boolean not null default false
);
alter table public.feedback enable row level security;  -- server only
create index if not exists feedback_created_idx on public.feedback (created_at desc);

-- Notification control: pause until a date, and which local weekdays (0 = Sunday … 6 = Saturday)
alter table public.subscribers add column if not exists paused_until timestamptz;
alter table public.subscribers add column if not exists days smallint[] not null default '{0,1,2,3,4,5,6}';

-- Email marketing: remember what was synced to Brevo
alter table public.profiles add column if not exists brevo_synced_at timestamptz;

-- Quick dashboards
create or replace view public.feedback_summary as
select date_trunc('week', created_at) as week, kind, count(*) as n, round(avg(rating), 2) as avg_rating
from public.feedback group by 1, 2 order by 1 desc, 2;
revoke all on public.feedback_summary from anon, authenticated;
