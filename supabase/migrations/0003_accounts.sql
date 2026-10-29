-- GoodPush — optional accounts (Google, Apple, email code)
-- Run after 0002_premium.sql. Then enable providers in Supabase → Authentication → Providers.

-- Devices and Premium can belong to an account
alter table public.subscribers add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists subscribers_user_idx on public.subscribers (user_id);

alter table public.premium add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists premium_user_idx on public.premium (user_id);

-- Synced app data (favorites, history, streak, settings) + marketing consent
create table if not exists public.profiles (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  email                 text,
  lang                  text not null default 'en',
  data                  jsonb not null default '{}'::jsonb,
  marketing_opt_in      boolean not null default false,
  marketing_consent_at  timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table public.profiles enable row level security;  -- server only (service role)

-- Premium is active for a device OR for every device of the paying account
create or replace view public.premium_active as
select device_id, user_id from public.premium where status in ('active', 'trialing');
revoke all on public.premium_active from anon, authenticated;

-- Email marketing audience (only people who explicitly opted in) — export to Brevo / Resend / MailerLite
create or replace view public.marketing_audience as
select email, lang, data -> 'profile' -> 'categories' as categories, marketing_consent_at
from public.profiles
where marketing_opt_in and email is not null;
revoke all on public.marketing_audience from anon, authenticated;
