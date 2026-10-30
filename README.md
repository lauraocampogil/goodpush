# GoodPush 😊😉

> Un buen empujón. Cada día. — One motivational phrase a day, straight to your phone.

PWA built with **SvelteKit 3 + Svelte 5 + Tailwind 4**, **Web Push**, and **Supabase**. No App Store, no account, no phone number.

---

## ✨ What's inside

| Area | Features |
| --- | --- |
| **Landing** | GSAP-animated: split-text hero, live phone with notifications dropping in, mouse-parallax stickers, crossing marquees, pinned scroll “How it works”, interactive vibe picker, animated bento (streak counter, heart burst, fanned share cards, typewriter names), pricing, FAQ, giant marquee CTA, view transitions |
| **Install** | Smart install sheet: step-by-step iPhone guide (+ warning for TikTok/Instagram in-app browser), native install button on Android |
| **Onboarding** | Numbered 5-step flow shown from the very first screen: **1 Install → 2 Name → 3 Vibe → 4 Time → 5 Push**, live preview, confetti |
| **App** | Phrase of the day with name + pink tape, **streaks**, **favorites**, **history**, **share as Story image** (1080×1920), settings, test push, delete my data |
| **Push** | Service worker: push, notification actions (♥ Save / ↗ Share), app badge, offline cache |
| **Money** | **Stripe Premium** (Checkout + webhook + Billing Portal): up to 3 pushes/day, Premium-only phrases, 4 share-card themes · affiliate pick per category |
| **Monitoring** | **PostHog** (cookie-less, funnel + installs + every option chosen) · **Sentry** (client + server errors) · error page |
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

### 5. Stripe Premium (10 min — use **Test mode** first)

1. Run [`supabase/migrations/0002_premium.sql`](supabase/migrations/0002_premium.sql) in Supabase.
2. Stripe → **Product catalog** → add product “GoodPush Premium”, recurring **2,99 € / month** → copy the `price_…` → `STRIPE_PRICE_ID`.
3. **Developers → API keys** → secret key → `STRIPE_SECRET_KEY`.
4. **Developers → Webhooks** → add endpoint `https://goodpush.app/api/stripe/webhook` with events
   `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` → signing secret → `STRIPE_WEBHOOK_SECRET`.
5. **Settings → Billing → Customer portal** → activate (lets people cancel / change card).
6. Test with card `4242 4242 4242 4242`. Locally: `stripe listen --forward-to localhost:5173/api/stripe/webhook`.

Premium is tied to the device id (no accounts). Supabase → view `stats` shows `premium` and `mrr_eur`.

### 6. PostHog + Sentry (5 min)

- **PostHog** (EU cloud) → project API key → `PUBLIC_POSTHOG_KEY`. Cookie-less (memory persistence), identified by the random device id.
  Main events: `cta_click`, `install_sheet_open`, **`app_installed`** (= a “download”: first open from the home screen or the Android install prompt), `onboarding_step`, `category_toggled`, `hour_selected`, `push_enabled` / `push_failed`, `phrase_viewed`, `favorite`, `share`, `affiliate_click`, `premium_view`, `checkout_started`, `premium_activated`, `theme_changed`, `extra_hour_toggled`, `lang_changed`, `streak_milestone`.
  Super-properties on every event: `lang`, `platform`, `standalone`, `source`, `premium`.
- **Sentry** → new project (SvelteKit) → DSN → `PUBLIC_SENTRY_DSN`. Errors from the browser and the server are reported.

### 7. Accounts — Google or email code (optional, 15 min)

1. Run [`supabase/migrations/0003_accounts.sql`](supabase/migrations/0003_accounts.sql).
2. Add `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API → anon key).
3. **Authentication → URL Configuration**: Site URL `https://goodpush.app`, redirect URL `https://goodpush.app/account` (+ `http://localhost:5173/account`).
4. **Email**: Authentication → Email Templates → “Magic Link”: put the code in the email, e.g. `Your GoodPush code: {{ .Token }}`. (A code works inside the installed iPhone app; a link would open Safari.)
5. **Google**: Google Cloud Console → OAuth client (Web) → callback `https://<project>.supabase.co/auth/v1/callback` → paste ID/secret in Supabase → Providers → Google.

Sign in with Apple is intentionally not used.

What accounts do: sync streak / favorites / history across phones, Premium follows the account, turn notifications off for any phone, email-marketing consent (view `marketing_audience` → export to Brevo/Resend/MailerLite), delete account (also cancels Premium).

### 8. Feedback (Sentry User Feedback)

The in-app sheet (smiley rating + Idea / Problem / Love + message) sends every message to:
**Sentry → User Feedback** (needs `PUBLIC_SENTRY_DSN`), the Supabase table **`feedback`** (view `feedback_summary`), and PostHog (`feedback_sent`).
Opened from Settings, the footer, and a one-time rating prompt after a 5-day streak. Run `0004_feedback_pause_email.sql`.

### 9. Analytics — PostHog dashboard recipe

Create these insights in PostHog (EU):

| Insight | Type | Events |
| --- | --- | --- |
| Acquisition funnel | Funnel | `$pageview` (/) → `cta_click` → `onboarding_step` (step 4) → `push_enabled` |
| Installs (“downloads”) | Trend | `app_installed` by `platform` |
| Daily engagement | Trend | `phrase_viewed` (unique users) · `push_sent` (server) |
| Retention | Retention | `push_enabled` → `phrase_viewed` |
| Virality | Trend | `share` by `theme` · `$pageview` with `utm_source = share` |
| Money | Trend | `checkout_started`, `premium_active` (server, `amount`), `affiliate_click` |
| Happiness | Trend | `feedback_sent` avg `rating` · `streak_milestone` |
| Churn signals | Trend | `push_paused`, `push_disabled`, `marketing_opt_out`, `account_deleted` |

Server events (`push_sent`, `cron_run`, `premium_active/inactive`, `account_deleted`, `newsletter_signup`, `marketing_opt_in/out`) are sent from the backend. Errors in Sentry carry the device id, language and release.

### 10. Notification control

People can turn notifications off, **pause** them (1 day / 1 week / 1 month), and choose **which weekdays** they get a push — in Settings, or for any phone from their account. The cron respects `paused_until` and `days`.

### 11. Email marketing — Brevo (EU)

1. Create a Brevo account → **Contacts → Lists** → new list “GoodPush” → id → `BREVO_LIST_ID`.
2. **Contacts → Settings → Attributes**: add `LANGUAGE` (text), `CATEGORIES` (text), `PREMIUM` (boolean), `SOURCE` (text).
3. **SMTP & API → API keys** → `BREVO_API_KEY`.
4. **Templates** → a *Double opt-in* template (“Confirm your subscription”) → id → `BREVO_DOI_TEMPLATE_ID`.
5. **Webhooks (marketing)** → `https://goodpush.app/api/email/webhook?token=…` (events: unsubscribed, hard bounce, spam) → same token in `BREVO_WEBHOOK_SECRET`.
6. Optional: Supabase → Auth → SMTP → use Brevo SMTP so login codes come from your domain.

Who gets emails: account users who ticked the box, and footer newsletter sign-ups (double opt-in). Segment by `LANGUAGE` and `CATEGORIES`.

Starter campaigns: **Welcome** (automation on list join: what GoodPush is + “turn on notifications”), **Weekly letter** (5 best phrases of the week + one tip + link to share), **Streak rescue** (no `phrase_viewed` for 3 days), **Premium nudge** (after 14 days, free users only).

### Streaks — the rule

Open GoodPush (or tap the push) at least once per calendar day → +1. Miss a full day → back to 0 (best streak is kept). Stored on the phone, synced to the account when signed in.

### 12. Optional

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

- [ ] Restore Premium on a new phone (magic link by email)
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

## 13. "In the news" quotes (automatic)

Every day at 03:00 UTC, `/api/cron/quotes` takes the most-followed sub-topics (`topics_popularity`,
max `QUOTES_MAX_TOPICS`) and asks Claude (with web search) for ONE real, recent, uplifting quote per topic.
A quote is published only if its exact words are found in the source article (or in the passage Claude cited).
Nothing is invented: if no verified quote is found, people simply get their usual phrase.

- Key: `ANTHROPIC_API_KEY` in Vercel. Cost ≈ 0.05–0.10 $ per topic per day — set a monthly limit in the Anthropic console.
- Schedule: second block in `supabase/cron.sql`.
- Test one topic: `curl -H "Authorization: Bearer $CRON_SECRET" "https://YOUR_SITE/api/cron/quotes?topic=football&dry"`
- Remove a bad quote: Supabase → `quotes` → untick `approved`.
- Movie mode: every theme has a `<theme>_movies` sub-topic (on by default when a theme is picked) → famous film lines that fit the theme, checked against Wikiquote/IMDb/articles.
