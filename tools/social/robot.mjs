// The robot: Notion (Approved) → renders the video / carousel → uploads to Postiz → schedules Instagram + TikTok → Notion (Scheduled).
//   node tools/social/robot.mjs            → posts due in the next 36 h (GitHub Actions runs it twice a day)
//   node tools/social/robot.mjs --dry      → renders only, nothing sent to Postiz / Notion
// Env: NOTION_TOKEN, POSTIZ_URL (your Postiz, e.g. https://postiz.example.com — or https://api.postiz.com for Postiz Cloud),
//      POSTIZ_API_KEY (Postiz → Settings → Public API), PEXELS_API_KEY (real footage for template R, optional)
//      POSTIZ_CHANNELS (optional JSON {"en":{"instagram":"id","tiktok":"id"},"es":{…}} — otherwise matched by name "goodpush.en"/"goodpush.es")
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { basename, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openRenderer } from '../videos/renderer.mjs';
import { clipFor } from '../videos/clips.mjs';
import { P, queryPosts, read, updatePost } from './notion.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dry = process.argv.includes('--dry');
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
const due = (await queryPosts({
	and: [
		{ property: 'Status', status: { equals: 'Approved' } },
		{ property: 'Publish at', date: { on_or_before: new Date(now + HORIZON_H * 3600_000).toISOString() } },
		{ property: 'Publish at', date: { on_or_after: new Date(now - 30 * 60_000).toISOString() } }
	]
})).sort((a, b) => read.date(a.properties['Publish at']).localeCompare(read.date(b.properties['Publish at'])));
console.log(`${due.length} approved posts due in the next ${HORIZON_H} h`);
if (!due.length) process.exit(0);

const chans = dry ? {} : await channels();
if (!dry) console.log('Postiz channels:', JSON.stringify(Object.fromEntries(Object.entries(chans).map(([l, c]) => [l, Object.keys(c)]))));
const r = await openRenderer();
let scheduled = 0;

for (const page of due) {
	const p = page.properties;
	const title = read.text(p.Post);
	const lang = (read.select(p.Language) ?? 'EN').toLowerCase();
	const format = read.select(p.Template) ?? 'D';
	const at = read.date(p['Publish at']);
	const platforms = read.multi(p.Platforms);
	const caption = [read.text(p.Caption), read.text(p.Hashtags)].filter(Boolean).join('\n\n');
	try {
		if (read.text(p['Postiz ID'])) continue;
		const f = JSON.parse(read.text(p['Fields (JSON)']) || '{}');
		const [date, slot] = /^(\d{4}-\d{2}-\d{2}) · (\w+)/.exec(title)?.slice(1) ?? [at.slice(0, 10), 'Morning'];
		const job = { date, slot, theme: f.theme ?? 'discipline', format, streak: f.streak ?? 0, hook: { [lang]: f.hook ?? '' }, phrases: (f.phrases ?? []).map((t) => ({ [lang]: t })) };
		if (!job.phrases.length) throw new Error('Fields (JSON) has no phrases');
		const base = `${date}_${slot.toLowerCase()}_${format}_${lang}`;

		// 1) render
		let igMedia, ttMedia, credit = null;
		if (format === 'E') {
			const { pngs, video } = await r.carousel(job, lang, out, base);
			igMedia = pngs; ttMedia = [video];
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
		if (platforms.includes('Instagram')) {
			if (!c.instagram) throw new Error(`No Instagram channel for goodpush.${lang} in Postiz`);
			const media = await Promise.all(igMedia.map(upload));
			const ch = asChannel(c.instagram);
			items.push({ integration: { id: ch.id }, value: [{ content: text, image: media }], settings: { __type: ch.identifier ?? 'instagram-standalone', post_type: 'post', is_trial_reel: false, collaborators: [] } });
		}
		if (platforms.includes('TikTok')) {
			if (!c.tiktok) throw new Error(`No TikTok channel for goodpush.${lang} in Postiz`);
			const media = igMedia === ttMedia && items.length ? items[0].value[0].image : await Promise.all(ttMedia.map(upload));
			const ch = asChannel(c.tiktok);
			items.push({
				integration: { id: ch.id },
				value: [{ content: text, image: media }],
				settings: {
					__type: 'tiktok', title: (f.phrases?.[0] ?? '').replace(/\*/g, '').slice(0, 90), privacy_level: 'PUBLIC_TO_EVERYONE',
					duet: true, stitch: true, comment: true, autoAddMusic: 'no', brand_content_toggle: false, brand_organic_toggle: false,
					video_made_with_ai: false, content_posting_method: process.env.POSTIZ_TIKTOK_METHOD || 'DIRECT_POST'
				}
			});
		}
		const res = await postiz('/posts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'schedule', date: new Date(at).toISOString(), shortLink: false, tags: [], posts: items }) });
		const ids = (Array.isArray(res) ? res : [res]).map((x) => x.postId ?? x.id ?? x.group).filter(Boolean).join(', ');
		await updatePost(page.id, { Status: P.status('Scheduled'), 'Postiz ID': P.text(ids || 'scheduled'), Preview: P.url(items[0]?.value[0].image[0]?.path), Error: P.text('') });
		scheduled++;
		console.log(`→ scheduled ${base} for ${at} (${platforms.join(' + ')})`);
	} catch (e) {
		if (e.budget) { console.log('Postiz hourly limit reached — the rest goes in the next run'); break; }
		console.error(`✗ ${title}: ${e.message}`);
		if (!dry) await updatePost(page.id, { Status: P.status('Error'), Error: P.text(e.message.slice(0, 1500)) }).catch(() => {});
	}
}
await r.close();
console.log(`Done: ${scheduled} scheduled · ${spent} Postiz requests`);
