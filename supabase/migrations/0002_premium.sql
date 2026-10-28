-- GoodPush — Premium (Stripe) + extra daily pushes
-- Run after 0001_init.sql

-- Premium lives in its own table: someone can pay before turning on notifications.
create table if not exists public.premium (
  device_id               text primary key,
  stripe_customer_id      text,
  stripe_subscription_id  text unique,
  status                  text not null default 'incomplete',  -- active | trialing | past_due | canceled | ...
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
alter table public.premium enable row level security;  -- server only

-- Extra local hours for Premium pushes (max 2) and which slots were sent today
alter table public.subscribers add column if not exists extra_hours smallint[] not null default '{}';
alter table public.subscribers add column if not exists sent_slots smallint[] not null default '{}';

-- Helper: is a device premium right now?
create or replace view public.premium_active as
select device_id from public.premium where status in ('active', 'trialing');
revoke all on public.premium_active from anon, authenticated;

-- Stats now include premium + MRR estimate (2.99 €)
create or replace view public.stats as
select
  (select count(*) from public.subscribers where active)                                  as active_subscribers,
  (select count(*) from public.subscribers where created_at > now() - interval '1 day')   as new_today,
  (select count(*) from public.subscribers where created_at > now() - interval '7 days')  as new_7d,
  (select count(*) from public.premium_active)                                            as premium,
  round((select count(*) from public.premium_active) * 2.99, 2)                           as mrr_eur;
revoke all on public.stats from anon, authenticated;
