-- GoodPush — hourly sender
-- 1) Database → Extensions: enable "pg_cron" and "pg_net"
-- 2) Replace YOUR_SITE and YOUR_CRON_SECRET below, then run this in the SQL Editor.

select cron.schedule(
  'goodpush-hourly-send',
  '0 * * * *',              -- every hour, on the hour
  $$
  select net.http_get(
    url     := 'https://YOUR_SITE/api/cron/send',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
    timeout_milliseconds := 30000
  );
  $$
);

-- To check runs:   select * from cron.job_run_details order by start_time desc limit 20;
-- To remove:       select cron.unschedule('goodpush-hourly-send');

-- Daily "in the news" quotes: Claude finds real quotes for the most-followed sub-topics.
-- Runs at 03:00 UTC, before the first morning pushes. Needs ANTHROPIC_API_KEY in Vercel.
select cron.schedule(
  'goodpush-daily-quotes',
  '0 3 * * *',
  $$
  select net.http_get(
    url     := 'https://YOUR_SITE/api/cron/quotes',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
    timeout_milliseconds := 300000
  );
  $$
);
-- Remove: select cron.unschedule('goodpush-daily-quotes');

-- Weekly newsletter "The Good Weekly": Sundays 08:00 UTC (09:00/10:00 Brussels). Needs BREVO_API_KEY + BREVO_LIST_ID.
select cron.schedule(
  'goodpush-weekly-newsletter',
  '0 8 * * 0',
  $$
  select net.http_get(
    url     := 'https://YOUR_SITE/api/cron/newsletter',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
    timeout_milliseconds := 120000
  );
  $$
);
