// Uploads a rendered week to Supabase Storage (bucket "social") and queues every post
// for Instagram (videos + carousels) and TikTok (videos). /api/cron/social publishes them on time.
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node tools/videos/queue.mjs 2026-12-07
// Safe to run again: files are overwritten, posts already published are left alone.
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const week = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(week ?? '')) throw new Error('Usage: node tools/videos/queue.mjs <monday>');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const dir = join(root, 'marketing', 'videos', week);
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
const urls = new Map();
let n = 0;
for (const post of manifest) {
	for (const f of post.files) {
		if (urls.has(f)) continue;
		const path = `${week}/${f}`;
		const { error } = await db.storage.from('social').upload(path, readFileSync(join(dir, f)), {
			contentType: f.endsWith('.mp4') ? 'video/mp4' : 'image/png', upsert: true, cacheControl: '31536000'
		});
		if (error) throw new Error(`${f}: ${error.message}`);
		urls.set(f, db.storage.from('social').getPublicUrl(path).data.publicUrl);
		n++;
	}
}
console.log(`↑ ${n} files uploaded`);

const rows = manifest.flatMap((p) => {
	const base = { lang: p.lang, post_date: p.date, slot: p.slot, format: p.format, kind: p.kind, media: p.files.map((f) => urls.get(f)), caption: p.caption, publish_at: p.publish_at };
	// TikTok photo posts need a verified domain — carousels go to Instagram only for now
	return p.kind === 'video' ? [{ ...base, platform: 'instagram' }, { ...base, platform: 'tiktok' }] : [{ ...base, platform: 'instagram' }];
});
// Don't touch posts that already went out
const { data: done } = await db.from('social_posts').select('platform,lang,post_date,slot').in('status', ['published', 'draft', 'processing']).gte('post_date', week);
const key = (r) => `${r.platform}|${r.lang}|${r.post_date}|${r.slot}`;
const skip = new Set((done ?? []).map(key));
const fresh = rows.filter((r) => !skip.has(key(r))).map((r) => ({ ...r, status: 'queued', attempts: 0, error: null }));
const { error } = await db.from('social_posts').upsert(fresh, { onConflict: 'platform,lang,post_date,slot' });
if (error) throw new Error(error.message);
console.log(`✓ ${fresh.length} posts queued (${rows.length - fresh.length} already out)`);
