// The planner ("agent"): writes the coming posts into Notion → GoodPush — Social Studio → Posts.
//   node tools/social/agent.mjs                → next week (Mon–Sun), what GitHub Actions runs on Sundays
//   node tools/social/agent.mjs 2026-11-13 3   → from a date, N days
// Safe to run again: a post already in Notion for the same language + time is skipped.
// AGENT_STATUS=To review makes you approve each post by hand (default Approved = fully automatic).
import { planRange } from '../videos/plan.mjs';
import { createPost, P, queryPosts, read } from './notion.mjs';

const LANGS = (process.env.SOCIAL_LANGS ?? 'en,es').split(',').map((l) => l.trim()).filter(Boolean);
const STATUS = process.env.AGENT_STATUS || 'Approved';
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const today = new Date().toISOString().slice(0, 10);
const nextMonday = addDays(today, ((8 - new Date(today + 'T12:00:00Z').getUTCDay()) % 7) || 7);
const [from = nextMonday, days = '7'] = process.argv.slice(2);

const rows = planRange(from, Number(days), { auto: true });
const startIso = new Date(from + 'T00:00:00Z').toISOString();
const endIso = new Date(addDays(from, Number(days) + 1) + 'T00:00:00Z').toISOString();
const existing = await queryPosts({ and: [{ property: 'Publish at', date: { on_or_after: startIso } }, { property: 'Publish at', date: { before: endIso } }] });
const have = new Set(existing.map((p) => `${read.select(p.properties.Language)}|${new Date(read.date(p.properties['Publish at'])).toISOString()}`));

let made = 0;
for (const r of rows) {
	for (const lang of LANGS) {
		const L = lang.toUpperCase();
		const at = r.publish[lang];
		if (have.has(`${L}|${new Date(at).toISOString()}`)) continue;
		const [caption] = r.caption[lang].split('\n\n#');
		const fields = { hook: r.hook[lang], phrases: r.phrases.map((p) => p[lang]), theme: r.theme, streak: r.streak };
		await createPost({
			Post: P.title(`${r.date} · ${r.slot} · ${r.format} · ${L} — ${r.hook[lang]}`),
			Status: P.status(STATUS),
			Template: P.select(r.format),
			Language: P.select(L),
			Platforms: P.multi(['Instagram', 'TikTok']),
			'Publish at': P.date(at),
			Caption: P.text(caption),
			Hashtags: P.text(r.hashtags[lang]),
			'Fields (JSON)': P.text(JSON.stringify(fields))
		});
		made++;
	}
}
console.log(`✓ ${made} posts created in Notion (${from} +${days} days, ${LANGS.join('/')}, status ${STATUS})`);
