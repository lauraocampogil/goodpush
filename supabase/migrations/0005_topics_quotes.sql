-- GoodPush — sub-topics (football, tennis, exams…) + "in the news" quotes
-- Run after 0004_feedback_pause_email.sql

alter table public.subscribers add column if not exists topics text[] not null default '{}';
create index if not exists subscribers_topics_idx on public.subscribers using gin (topics);

-- Real quotes from the news. Add rows in Table editor, always with the source link,
-- then tick `approved`. On `publish_on`, everyone who picked `topic` gets it.
create table if not exists public.quotes (
  id           bigint generated always as identity primary key,
  topic        text not null,                       -- e.g. football, tennis, startup (see src/lib/data/topics.ts)
  author       text not null,                       -- e.g. Kylian Mbappé
  quote_en     text,
  quote_es     text,
  quote_fr     text,                                -- fill at least one; empty languages show the original
  context      text,                                -- e.g. "after the Clásico" (for you, not shown)
  source_url   text not null check (source_url ~ '^https?://'),
  said_on      date,
  publish_on   date not null default current_date,
  approved     boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint quotes_has_text check (coalesce(quote_en, quote_es, quote_fr) is not null)
);
alter table public.quotes enable row level security;  -- server only
create index if not exists quotes_publish_idx on public.quotes (publish_on) where approved;

-- Who picked what (for deciding which quotes to look for)
create or replace view public.topics_popularity as
select t as topic, count(*) as subscribers
from public.subscribers, unnest(topics) t
where active
group by 1 order by 2 desc;
revoke all on public.topics_popularity from anon, authenticated;
