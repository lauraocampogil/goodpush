-- Exact push times (08:15, 08:30…) instead of whole hours, and the "trial ended" email/push sent once.
alter table public.subscribers add column if not exists minute smallint not null default 0 check (minute between 0 and 59);
alter table public.subscribers add column if not exists extra_minutes smallint[] not null default '{}';
alter table public.subscribers add column if not exists trial_end_notified boolean not null default false;

-- The send job now runs every 5 minutes (it only sends when someone's time has come)
select cron.unschedule('goodpush-hourly-send') where exists (select 1 from cron.job where jobname = 'goodpush-hourly-send');
select cron.schedule('goodpush-hourly-send', '*/5 * * * *', $$ select public.goodpush_call('/api/cron/send', 30000) $$);
