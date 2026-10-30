-- GoodPush — movie mode inside every theme (topics like 'sport_movies', 'calm_movies'…)
-- No schema change needed: they are normal sub-topics. This file only documents it and
-- refreshes the popularity view (used to choose which topics the quote finder searches).
create or replace view public.topics_popularity as
select t as topic, count(*) as subscribers
from public.subscribers, unnest(topics) t
where active
group by 1 order by 2 desc;
revoke all on public.topics_popularity from anon, authenticated;
