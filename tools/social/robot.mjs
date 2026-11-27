// The robot: Notion (Approved) → renders the video / carousel → uploads to Postiz → schedules Instagram + TikTok → Notion (Scheduled).
//   node tools/social/robot.mjs            → posts due in the next 36 h (GitHub Actions runs it twice a day)
//   node tools/social/robot.mjs --dry      → renders only, nothing sent to Postiz / Notion
// Env: NOTION_TOKEN, POSTIZ_URL (your Postiz, e.g. https://postiz.example.com — or https://api.postiz.com for Postiz Cloud),
//      POSTIZ_API_KEY (Postiz → Settings → Public API), PIXABAY_API_KEY or PEXELS_API_KEY (stock footage, optional)
//      POSTIZ_CHANNELS (optional JSON {"en":{"instagram":"id","tiktok":"id"},"es":{…}} — otherwise matched by name "goodpush.en"/"goodpush.es")
import { mkdirSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRenderer } from '../videos/renderer.mjs';
import { clipFor, joyClips } from '../videos/clips.mjs';
import { QUOTES } from '../videos/quotes.mjs';
import { quoteScript } from '../videos/pushes.mjs';
import { sentences } from '../videos/scripts.mjs';
import { P, queryPosts, read, updatePost } from './notion.mjs';
import { planRange } from '../videos/plan.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const preview = process.argv.includes('--preview'); // render tomorrow's plan from scratch (no Notion, no Postiz) → marketing/robot
const dry = preview || process.argv.includes('--dry');
const HORIZON_H = Number(process.env.ROBOT_HORIZON_HOURS ?? 36);
const BUDGET = Number(process.env.POSTIZ_BUDGET ?? 25); // Postiz public API: 30 requests / hour
const out = join(root, 'marketing', 'robot');
mkdirSync(out, { recursive: true });

// ---------- Postiz ----------
const raw = (process.env.POSTIZ_URL ?? '').replace(/\/$/, '');
const API = raw.includes('api.postiz.com') ? `${raw.replace(/\/public\/v1$/, '')}/public/v1` : `${raw.replace(/\/api\/public\/v1$/, '')}/api/public/v1`;
let spent = 0;
async function postiz(path, init = {}) {
	if (spent >= BUDGET) throw Object.assign(new Error('budget'), { budget: true });
	spent++;
	const res = await fetch(API + path, { ...init, headers: { authorization: process.env.POSTIZ_API_KEY, ...(init.headers ?? {}) } });
	const text = await res.text();
	if (!res.ok) throw new Error(`Postiz ${path} ${res.status}: ${text.slice(0, 300)}`);
	return text ? JSON.parse(text) : {};
}
async function upload(file) {
	const form = new FormData();
	form.append('file', new Blob([readFileSync(file)], { type: file.endsWith('.mp4') ? 'video/mp4' : 'image/png' }), basename(file));
	const r = await postiz('/upload', { method: 'POST', body: form });
	return { id: r.id, path: r.path };
}
async function channels() {
	if (process.env.POSTIZ_CHANNELS) return JSON.parse(process.env.POSTIZ_CHANNELS);
	const list = await postiz('/integrations');
	const map = {};
	for (const i of Array.isArray(list) ? list : list.integrations ?? []) {
		if (i.disabled) continue;
		const who = `${i.profile ?? ''} ${i.name ?? ''}`.toLowerCase();
		const lang = /goodpush[._ -]?en\b/.test(who) ? 'en' : /goodpush[._ -]?es\b/.test(who) ? 'es' : null;
		const kind = String(i.identifier ?? i.providerIdentifier ?? '').startsWith('instagram') ? 'instagram' : String(i.identifier ?? i.providerIdentifier ?? '').startsWith('tiktok') ? 'tiktok' : null;
		if (lang && kind) (map[lang] ??= {})[kind] = { id: i.id, identifier: i.identifier ?? i.providerIdentifier };
	}
	return map;
}
const asChannel = (c) => (typeof c === 'string' ? { id: c } : c);

// ---------- run ----------
const now = Date.now();
// Normalised post: { id, title, lang, format, at, platforms, caption, fields }
const fromNotion = (page) => { const p = page.properties; return { id: page.id, title: read.text(p.Post), lang: (read.select(p.Language) ?? 'EN').toLowerCase(), format: read.select(p.Template) ?? 'D', at: read.date(p['Publish at']), platforms: read.multi(p.Platforms), caption: [read.text(p.Caption), read.text(p.Hashtags)].filter(Boolean).join('\n\n'), fieldsRaw: read.text(p['Fields (JSON)']), postizId: read.text(p['Postiz ID']) }; };
function fromPlan() {
	const day = process.env.PREVIEW_DATE || new Date(now + 864e5).toISOString().slice(0, 10);
	return planRange(day, 1, { auto: true }).flatMap((r) => ['en', 'es'].map((lang) => ({
		id: null, title: `${r.date} · ${r.slot} · ${r.format} · ${lang.toUpperCase()}`, lang, format: r.format, at: r.publish[lang], platforms: ['Instagram', 'TikTok'], caption: r.caption[lang],
		fieldsRaw: JSON.stringify({ hook: r.hook[lang], phrases: r.phrases.map((x) => x[lang]), ...(r.script ? { script: r.script[lang] } : {}), ...(r.quote ? { quote: r.quote } : {}), theme: r.theme, streak: r.streak })
	})));
}
const due = preview ? fromPlan() : (await queryPosts({
	and: [
		{ property: 'Status', status: { equals: 'Approved' } },
		{ property: 'Publish at', date: { on_or_before: new Date(now + HORIZON_H * 3600_000).toISOString() } },
		{ property: 'Publish at', date: { on_or_after: new Date(now - 30 * 60_000).toISOString() } }
	]
})).map(fromNotion).sort((a, b) => a.at.localeCompare(b.at));
console.log(`${due.length} ${preview ? 'preview' : 'approved'} posts due`);
if (!due.length) process.exit(0);

const chans = dry ? {} : await channels();
if (!dry) console.log('Postiz channels:', JSON.stringify(Object.fromEntries(Object.entries(chans).map(([l, c]) => [l, Object.keys(c)]))));
const r = await openRenderer();
let scheduled = 0;

for (const page of due) {
	const { title, lang, format, at, platforms, caption } = page;
	try {
		if (page.postizId) continue;
		const f = JSON.parse(page.fieldsRaw || '{}');
		const [date, slot] = /^(\d{4}-\d{2}-\d{2}) · (\w+)/.exec(title)?.slice(1) ?? [at.slice(0, 10), 'Morning'];
		const job = { date, slot, theme: f.theme ?? 'discipline', format, streak: f.streak ?? 0, hook: { [lang]: f.hook ?? '' }, phrases: (f.phrases ?? []).map((t) => ({ [lang]: t })) };
		if (!job.phrases.length) throw new Error('Fields (JSON) has no phrases');
		const base = `${date}_${slot.toLowerCase()}_${format}_${lang}`;

		// 1) render
		let igMedia, ttMedia, credit = null;
		if (format === 'E') {
			const { pngs, video } = await r.carousel(job, lang, out, base);
			igMedia = pngs; ttMedia = [video];
		} else if (format === 'Q' || format === 'S' || format === 'K') {
			// GoodPush voice videos: brand colours that change every sentence, the logo, AI voice, words in sync — no footage
			let lines;
			if (format === 'K') lines = f.script?.length ? f.script : [f.hook, ...(f.phrases ?? [])].filter(Boolean);
			else {
				const q = QUOTES.find((x) => x.id === f.quote);
				if (!q) throw new Error(`Unknown quote id "${f.quote}" (tools/videos/quotes.mjs)`);
				// intro → the real quote → what it means for you today → move (tools/videos/pushes.mjs)
				lines = quoteScript(q, lang, sentences((q[lang] ?? q.en).replace(/\*/g, '')), base);
			}
			const file = join(out, `${base}.mp4`);
			if (!existsSync(file)) {
				try { await r.voice({ ...job, seed: base }, lang, file, lines); }
				catch (e) { console.warn(`voice failed (${e.message}) → silent version`); await r.pulse({ ...job, lines }, lang, file); }
			}
			igMedia = ttMedia = [file];
		} else if (format === 'J') {
			// One positive phrase in the usual GoodPush design, no voice.
			// TikTok gets it SILENT → Laura adds a trending song (Happy, MJ…) when she publishes the draft (TikTok licenses those).
			// Instagram is posted automatically, so it gets a royalty-free track from marketing/music/ (or none if the folder is empty).
			const tt = join(out, `${base}_tt.mp4`), ig = join(out, `${base}.mp4`);
			if (!existsSync(tt)) await r.phrase({ ...job, seed: base, kicker: f.kicker }, lang, tt, f.phrases[0], null);
			const musicDir = join(root, 'marketing', 'music');
			const tracks = existsSync(musicDir) ? readdirSync(musicDir).filter((x) => /\.(mp3|m4a|wav)$/i.test(x)).sort() : [];
			const track = tracks.length ? join(musicDir, tracks[[...base].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % tracks.length]) : null;
			// No tracks in marketing/music → the original GoodPush score (music.py, the one the voice videos used)
			let score = track;
			if (!score) { score = join(out, `${base}_music.wav`); if (!existsSync(score)) execFileSync('python3', [join(root, 'tools/videos/music.py'), score, '8', base]); }
			if (!existsSync(ig)) await r.phrase({ ...job, seed: base, kicker: f.kicker }, lang, ig, f.phrases[0], score);
			igMedia = [ig]; ttMedia = [tt];
			// Instagram is automatic (with a royalty-free song from marketing/music/). IG_MANUAL=1 → TikTok only.
			if (process.env.IG_MANUAL === '1') platforms.splice(0, platforms.length, ...platforms.filter((pl) => pl !== 'Instagram'));
			// New account: Instagram only once a day (the evening post) so it isn't flagged as spam
			if (slot !== (process.env.IG_SLOT || 'Evening')) platforms.splice(0, platforms.length, ...platforms.filter((pl) => pl !== 'Instagram'));
		} else if (format === 'M') {
			const file = join(out, `${base}.mp4`);
			if (!existsSync(file)) await r.mascotCard(job, lang, file);
			igMedia = ttMedia = [file];
		} else {
			let clip = null;
			if (format === 'R') {
				clip = await clipFor(job, root).catch(() => null);
				if (!clip) job.format = 'D';
				credit = clip?.credit ?? null;
			}
			const file = join(out, `${base}.mp4`);
			if (!existsSync(file)) await r.video(job, lang, file, clip?.file ?? null);
			igMedia = ttMedia = [file];
		}
		console.log(`✓ rendered ${base}`);
		if (dry) continue;

		// 2) upload + schedule (one Postiz post per language: Instagram + TikTok together)
		const c = chans[lang] ?? {};
		const items = [];
		const text = credit ? `${caption}\n\n${credit}` : caption;
		// A missing channel (e.g. TikTok goodpush.es not created yet) is skipped; the post still goes out on the others
		const missing = platforms.filter((pl) => (pl === 'Instagram' && !c.instagram) || (pl === 'TikTok' && !c.tiktok));
		if (missing.length) console.warn(`  ! no ${missing.join(' + ')} channel for goodpush.${lang} in Postiz — skipped`);
		if (missing.length === platforms.length) throw new Error(`No ${platforms.join(' / ')} channel for goodpush.${lang} in Postiz`);
		if (platforms.includes('Instagram') && c.instagram) {
			const media = await Promise.all(igMedia.map(upload));
			const ch = asChannel(c.instagram);
			items.push({ integration: { id: ch.id }, value: [{ content: text, image: media }], settings: { __type: ch.identifier ?? 'instagram-standalone', post_type: 'post', ...(format === 'J' && process.env.IG_TRIAL !== '0' ? { is_trial_reel: true, graduation_strategy: 'SS_PERFORMANCE' } : { is_trial_reel: false }), collaborators: [] } });
		}
		if (platforms.includes('TikTok') && c.tiktok) {
			const media = igMedia === ttMedia && items.length ? items[0].value[0].image : await Promise.all(ttMedia.map(upload));
			const ch = asChannel(c.tiktok);
			items.push({
				integration: { id: ch.id },
				value: [{ content: text, image: media }],
				settings: {
					__type: 'tiktok', title: (f.phrases?.[0] ?? '').replace(/\*/g, '').slice(0, 90), privacy_level: 'PUBLIC_TO_EVERYONE',
					duet: true, stitch: true, comment: true, autoAddMusic: 'no', brand_content_toggle: false, brand_organic_toggle: false,
					video_made_with_ai: false, content_posting_method: process.env.POSTIZ_TIKTOK_METHOD || 'UPLOAD' // UPLOAD = draft in the TikTok inbox (until the app passes TikTok's review); DIRECT_POST after
				}
			});
		}
		const res = await postiz('/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'schedule', date: new Date(at).toISOString(), shortLink: false, tags: [], posts: items }) });
		const ids = (Array.isArray(res) ? res : [res]).map((x) => x.postId ?? x.id ?? x.group).filter(Boolean).join(', ');
		await updatePost(page.id, { Status: P.status('Scheduled'), 'Texto TikTok (copiar)': P.text(caption), 'Postiz ID': P.text(ids || 'scheduled'), Preview: P.url(items[0]?.value[0].image[0]?.path), Error: P.text('') });
		scheduled++;
		console.log(`→ scheduled ${base} for ${at} (${platforms.filter((pl) => !missing.includes(pl)).join(' + ')})`);
	} catch (e) {
		if (e.budget) { console.log('Postiz hourly limit reached — the rest goes in the next run'); break; }
		console.error(`✗ ${title}: ${e.message}`);
		if (!dry) await updatePost(page.id, { Status: P.status('Error'), Error: P.text(e.message.slice(0, 1500)) }).catch(() => {});
	}
}
await r.close();
console.log(`Done: ${scheduled} scheduled · ${spent} Postiz requests`);
