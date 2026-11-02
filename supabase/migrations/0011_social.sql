-- GoodPush — automatic publishing to Instagram + TikTok (one account per language).
-- social_accounts: tokens from "Connect" on /admin/social (server only — RLS on, no policies).
-- social_posts: the queue filled every Saturday by GitHub Actions, emptied by /api/cron/social.
create table if not exists public.social_accounts (
  platform text not null check (platform in ('instagram', 'tiktok')),
  lang text not null check (lang in ('en', 'es', 'fr')),
  external_id text,
  username text,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz,
  refresh_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (platform, lang)
);
alter table public.social_accounts enable row level security;

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram', 'tiktok')),
  lang text not null check (lang in ('en', 'es', 'fr')),
  post_date date not null,
  slot text not null,
  format text not null,
  kind text not null check (kind in ('video', 'carousel')),
  media text[] not null,
  caption text not null,
  publish_at timestamptz not null,
  -- queued → processing → published | draft (TikTok inbox) | failed | skipped
  status text not null default 'queued',
  container_id text,
  external_id text,
  attempts int not null default 0,
  error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (platform, lang, post_date, slot)
);
create index if not exists social_posts_due on public.social_posts (status, publish_at);
alter table public.social_posts enable row level security;

-- Public bucket for the rendered files (Instagram fetches them by URL)
insert into storage.buckets (id, name, public)
values ('social', 'social', true)
on conflict (id) do update set public = true;
