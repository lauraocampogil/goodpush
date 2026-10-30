-- GoodPush — Movies category: fans without a movie sub-topic count as "classics"
create or replace view public.topics_popularity as
select topic, count(*) as subscribers
from (
  select unnest(topics) as topic from public.subscribers where active
  union all
  select 'classics' from public.subscribers
  where active and 'movies' = any(categories)
    and not (topics && array['classics','animation','sportsfilms','superheroes'])
) t
group by 1 order by 2 desc;
revoke all on public.topics_popularity from anon, authenticated;
