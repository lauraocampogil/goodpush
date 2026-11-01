# GoodPush video factory

Turns the content calendar into ready-to-post videos (EN / ES / FR), in the GoodPush design.

```bash
npm i -D playwright && npx playwright install chromium   # once
node tools/videos/render.mjs 2026-11-09                  # renders the week starting that Monday
```

Output → `marketing/videos/<monday>/`:
- `<date>_<slot>_<format>_<lang>.mp4` — 1080×1920, 30 fps, 7–9 s, no sound (add a trending sound in TikTok / Instagram)
- `<date>_evening_E_<lang>_1..6.png` — carousels (1080×1350)
- `captions.md` — caption + hashtags for every post, in order

Formats: A lock-screen push · B pick 1/2/3 · D phrase on color · E carousel · F streak series.
C (app demo) is a screen recording you film with your phone.

Edit `build_calendar.py` (themes, hooks, times) then re-run it to refresh `plan.json`.
