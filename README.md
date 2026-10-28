# GoodPush 😊😉

> Un buen empujón. Cada día. — One motivational phrase a day, straight to your phone.

PWA built with **SvelteKit 3 + Svelte 5 + Tailwind 4**, **Web Push**, and **Supabase**. No App Store, no account, no phone number.

---

## ✨ What's inside

| Area | Features |
| --- | --- |
| **Landing** | Responsive hero, how it works, categories, sample phrases, features, FAQ, final CTA, language switcher (EN default · ES · FR) |
| **Install** | Smart install sheet: step-by-step iPhone guide (+ warning for TikTok/Instagram in-app browser), native install button on Android |
| **Onboarding** | Name (optional) → categories → time → notifications, with a live preview of the push |
| **App** | Phrase of the day with name + pink tape, **streaks**, **favorites**, **history**, **share as Story image** (1080×1920), settings, test push, delete my data |
| **Push** | Service worker: push, notification actions (♥ Save / ↗ Share), app badge, offline cache |
| **Money** | Premium page (Stripe Payment Link), affiliate pick per category (with legal disclosure) |
| **Growth** | SEO meta + OpenGraph image, sitemap, robots, JSON-LD, first-touch attribution (`?utm_source=tiktok&utm_campaign=v12` → saved per subscriber), cookie-less PostHog events, feedback → Instagram DM, share links with UTM |
| **Legal** | Privacy + Terms templates (GDPR), self-hosted fonts (no Google Fonts requests) |

Everything works in **demo mode** without any keys — perfect for designing. Add keys to go live.

---

## 🚀 Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. To test on your phone on the same Wi-Fi: `npm run dev -- --host`.

> Push notifications need HTTPS (or localhost). To test real pushes on your phone, deploy to Vercel (below).

---

## 🔌 Go live — step by step

### 1. Web Push keys (2 min)

```bash
npx web-push generate-vapid-keys
```

Put the **Public Key** in `PUBLIC_VAPID_KEY` and the **Private Key** in `VAPID_PRIVATE_KEY`.

### 2. Supabase (5 min)

1. Create a project at [supabase.com](https://supabase.com) → region **West EU (Ireland)** or **Central EU (Frankfurt)**.
2. **SQL Editor** → New query → paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → Run.
3. **Project Settings → API**: copy the URL → `SUPABASE_URL` and the `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret! only on the server / Vercel).

### 3. Deploy on Vercel (5 min)

1. Push this repo to GitHub (see below) → [vercel.com/new](https://vercel.com/new) → import it.
2. Add all variables from `.env.example` in **Settings → Environment Variables**.
3. Generate a `CRON_SECRET`: `openssl rand -hex 32`.
4. Add your domain (e.g. `goodpush.app`) and set `PUBLIC_SITE_URL`.

### 4. Daily sender (2 min)

Supabase → **Database → Extensions**: enable `pg_cron` and `pg_net`. Then run [`supabase/cron.sql`](supabase/cron.sql) with your domain and `CRON_SECRET`.

It runs every hour and sends the phrase to everyone whose chosen hour has arrived **in their own time zone**, once per day. Dead subscriptions are deactivated automatically.

Manual test (dry run, sends nothing):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://goodpush.app/api/cron/send?dry"
```

### 5. Optional

- **PostHog** (EU) → `PUBLIC_POSTHOG_KEY` for the funnel: `landing_view → cta_click → onboarding_done → push_enabled → share`.
- **Stripe** → create a Payment Link (2,99 €/month) → `PUBLIC_STRIPE_PREMIUM_LINK`. The device id is passed as `client_reference_id` (for the webhook in phase 2).
- **Amazon Associates** → `PUBLIC_AMAZON_TAG`. Edit picks in `src/lib/data/picks.ts`.

---

## 🐙 GitHub

```bash
git remote add origin https://github.com/lauraocampogil/goodpush.git
git push -u origin main
```

(Create an **empty** repo named `goodpush` on GitHub first — no README, no .gitignore.)

---

## ✍️ Adding phrases

Edit [`src/lib/data/phrases.ts`](src/lib/data/phrases.ts). Wrap **one** key word in `*asterisks*` → it gets the pink tape. Never change an existing `id`. Push to GitHub → Vercel redeploys.

## 📈 See your growth

In Supabase → Table editor: views **`stats`** (active, new today, new 7 days) and **`stats_by_source`** (which TikTok/IG video brings subscribers). Put links in your bio like `https://goodpush.app/?utm_source=tiktok&utm_campaign=v12` (v12 = video number).

---

## 🗺️ Roadmap (next)

- [ ] Stripe webhook → set `premium = true` and unlock up to 3 pushes/day + exclusive phrases
- [ ] Phrases in Supabase / Directus (admin panel without redeploy)
- [ ] Sync favorites/streak to Supabase (multi-device)
- [ ] Streak reminders ("Don't lose your 12-day streak!")
- [ ] Referral: "Invite a friend, unlock a theme"
- [ ] Translate legal pages to ES/FR

## 🗂️ Structure

```
src/
  env.ts                    → all environment variables (typed, optional = demo mode)
  hooks.server.ts           → language detection (cookie → Accept-Language → EN)
  service-worker/           → push, notification actions, offline cache
  lib/
    data/                   → categories, phrases, affiliate picks
    i18n/                   → EN / ES / FR dictionaries
    components/             → Logo, Smiley, NotifCard, PhraseText, InstallSheet, Seo
    store.svelte.ts         → local-first state (profile, favorites, history, streak)
    phrase.ts               → phrase-of-the-day logic (same on server + app)
    push.ts · share.ts · analytics.ts · platform.ts
    server/                 → Supabase + web-push (server only)
  routes/
    (site)/                 → landing, premium, privacy, terms (SSR, SEO)
    (app)/                  → start, today, saved, history, settings (client-only)
    api/subscribe           → save / delete a subscriber
    api/cron/send           → hourly sender
supabase/                   → SQL schema + cron
```

---

Made in Brussels by [Unix Creative Studio](https://github.com/lauraocampogil).
