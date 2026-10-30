-- GoodPush — 14-day free trial, then the GoodPush Pass (4,99 €/year)
alter table public.subscribers add column if not exists trial_started_at date default current_date;

drop view if exists public.stats;
create view public.stats as
select
  (select count(*) from public.subscribers where active)                                                    as active_subscribers,
  (select count(*) from public.subscribers where created_at > now() - interval '1 day')                     as new_today,
  (select count(*) from public.subscribers where created_at > now() - interval '7 days')                    as new_7d,
  (select count(*) from public.subscribers where active and coalesce(trial_started_at, created_at::date) > current_date - 14) as in_trial,
  (select count(*) from public.premium_active)                                                              as paying,
  round((select count(*) from public.premium_active) * 4.99, 2)                                             as arr_eur;
revoke all on public.stats from anon, authenticated;
