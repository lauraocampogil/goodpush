-- GoodPush — read-only view of the scheduled jobs for the /status page (no secrets returned)
create or replace function public.goodpush_cron_status()
returns table (jobname text, schedule text, active boolean, last_status text, last_run timestamptz, last_http int)
language sql
security definer
set search_path = public, cron, net
as $$
  select j.jobname::text, j.schedule::text, j.active,
         d.status::text, d.start_time,
         (select r.status_code from net._http_response r order by r.created desc limit 1)::int
  from cron.job j
  left join lateral (
    select status, start_time from cron.job_run_details x where x.jobid = j.jobid order by start_time desc limit 1
  ) d on true
  where j.jobname like 'goodpush-%';
$$;
revoke all on function public.goodpush_cron_status() from public, anon, authenticated;
grant execute on function public.goodpush_cron_status() to service_role;
