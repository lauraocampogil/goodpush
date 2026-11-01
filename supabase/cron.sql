-- GoodPush — all scheduled jobs. The CRON_SECRET lives once in Supabase Vault (never in the SQL).
--
-- STEP 1 (you, once): replace PASTE_CRON_SECRET with your CRON_SECRET (same as in Vercel) and run:
--   select vault.create_secret('PASTE_CRON_SECRET', 'goodpush_cron_secret');
--
-- STEP 2: run the rest (safe to run again: it replaces the jobs).

create or replace function public.goodpush_call(path text, timeout_ms int default 30000)
returns bigint language sql security definer set search_path = public, extensions, vault, net as $$
  select net.http_get(
    url := 'https://goodpush-app.vercel.app' || path,
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'goodpush_cron_secret' limit 1)),
    timeout_milliseconds := timeout_ms
  );
$$;
revoke all on function public.goodpush_call(text, int) from public, anon, authenticated;

select cron.unschedule(jobname) from cron.job where jobname in ('goodpush-hourly-send', 'goodpush-daily-quotes', 'goodpush-weekly-newsletter');

-- Every hour: everyone gets their push at their own local hour
select cron.schedule('goodpush-hourly-send', '0 * * * *', $$ select public.goodpush_call('/api/cron/send', 30000) $$);
-- Every day 03:00 UTC: AI finds real quotes (news + movies) — does nothing until ANTHROPIC_API_KEY is set
select cron.schedule('goodpush-daily-quotes', '0 3 * * *', $$ select public.goodpush_call('/api/cron/quotes', 300000) $$);
-- Every Sunday 08:00 UTC: "The Good Weekly" newsletter — does nothing until Brevo is set
select cron.schedule('goodpush-weekly-newsletter', '0 8 * * 0', $$ select public.goodpush_call('/api/cron/newsletter', 120000) $$);

-- Check:  select * from public.goodpush_cron_status();
