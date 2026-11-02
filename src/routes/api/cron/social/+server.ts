import { error, json } from '@sveltejs/kit';
import { CRON_SECRET } from '$app/env/private';
import { db } from '#lib/server/supabase.ts';
import { checkPost, createPost, refreshIfNeeded, type Account, type Post } from '#lib/server/social.ts';
import { captureServer } from '#lib/server/analytics.ts';
import type { RequestHandler } from './$types';

export const config = { maxDuration: 300 };

const LATE_MS = 12 * 3600_000; // a post more than 12 h late is skipped (not dumped all at once)
const MAX_NEW = 9;

/**
 * Every 10 min (Supabase cron): finishes posts Instagram/TikTok are still processing,
 * then starts the ones whose time has come. Nothing happens for an account that isn't connected.
 */
export const GET: RequestHandler = async ({ request }) => {
	if (!CRON_SECRET || request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) error(401, 'Unauthorized');
	const supabase = db();
	if (!supabase) error(503, 'Supabase not configured');

	const { data: accs } = await supabase.from('social_accounts').select('*');
	const accounts = new Map<string, Account>();
	const log: string[] = [];
	for (const a of (accs ?? []) as Account[]) {
		try {
			accounts.set(`${a.platform}|${a.lang}`, await refreshIfNeeded(supabase, a));
		} catch (e) {
			log.push(`token ${a.platform}/${a.lang}: ${(e as Error).message}`);
			accounts.set(`${a.platform}|${a.lang}`, a);
		}
	}
	const acc = (p: Post) => accounts.get(`${p.platform}|${p.lang}`);
	const save = (id: string, patch: Record<string, unknown>) => supabase.from('social_posts').update(patch).eq('id', id);
	let published = 0, started = 0, failed = 0;

	// 1) Posts in progress
	const { data: busy } = await supabase.from('social_posts').select('*').eq('status', 'processing').limit(30);
	for (const p of (busy ?? []) as Post[]) {
		const a = acc(p);
		if (!a) continue;
		try {
			const r = await checkPost(a, p);
			if (r.status === 'processing' && Date.parse(p.publish_at) < Date.now() - 3 * 3600_000) {
				await save(p.id, { status: 'failed', error: 'still processing after 3 h' });
				failed++;
			} else if (r.status !== 'processing') {
				await save(p.id, { status: r.status, external_id: r.external_id ?? null, error: r.error ?? null, published_at: r.status === 'failed' ? null : new Date().toISOString() });
				if (r.status === 'failed') failed++; else published++;
			}
		} catch (e) {
			log.push(`check ${p.platform}/${p.lang} ${p.post_date} ${p.slot}: ${(e as Error).message}`);
		}
	}

	// 2) Posts whose time has come
	const now = Date.now();
	const { data: due } = await supabase.from('social_posts').select('*').eq('status', 'queued').lte('publish_at', new Date(now).toISOString()).order('publish_at').limit(40);
	for (const p of (due ?? []) as Post[]) {
		if (Date.parse(p.publish_at) < now - LATE_MS) {
			await save(p.id, { status: 'skipped', error: acc(p) ? 'too late' : 'account not connected' });
			continue;
		}
		const a = acc(p);
		if (!a || started >= MAX_NEW) continue;
		try {
			const container = await createPost(a, p);
			await save(p.id, { status: 'processing', container_id: container, attempts: p.attempts + 1, error: null });
			started++;
		} catch (e) {
			const msg = (e as Error).message.slice(0, 300);
			await save(p.id, { status: p.attempts + 1 >= 3 ? 'failed' : 'queued', attempts: p.attempts + 1, error: msg });
			log.push(`create ${p.platform}/${p.lang} ${p.post_date} ${p.slot}: ${msg}`);
			if (p.attempts + 1 >= 3) failed++;
		}
	}

	if (started || published || failed) await captureServer({ event: 'social_cron', distinct_id: 'cron', properties: { started, published, failed } });
	return json({ ok: true, accounts: accounts.size, started, published, failed, log });
};
