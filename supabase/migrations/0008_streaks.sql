-- GoodPush — streak on the server, so the notification can say "🔥 12 days"
alter table public.subscribers add column if not exists streak_count int not null default 0;
alter table public.subscribers add column if not exists streak_last date;
