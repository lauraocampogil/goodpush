import { error, json } from '@sveltejs/kit';
import { getUser } from '#lib/server/auth.ts';
import { db } from '#lib/server/supabase.ts';
import { authorizeUrl, isAdmin, platformReady, PLATFORMS, SOCIAL_LANGS, tiktokDirect, type Platform, type SocialLang } from '#lib/server/social.ts';
import type { RequestHandler } from './$types';

async function admin(request: Request) {
	const supabase = db();
	if (!supabase) error(503, 'Supabase not configured');
	const user = await getUser(request);
	if (!user) error(401, 'Please sign in');
	if (!isAdmin(user)) error(403, 'Not an admin (Vercel → ADMIN_EMAILS)');
	return supabase;
}

/** Accounts (never tokens) + the queue around now. */
export const GET: RequestHandler = async ({ request }) => {
	const supabase = await admin(request);
	const since = new Date(Date.now() - 3 * 86400_000).toISOString();
	const [{ data: accounts }, { data: posts }] = await Promise.all([
		supabase.from('social_accounts').select('platform,lang,username,expires_at,refresh_expires_at,updated_at'),
		supabase.from('social_posts').select('id,platform,lang,post_date,slot,format,kind,media,caption,publish_at,status,error,published_at').gte('publish_at', since).order('publish_at').limit(400)
	]);
	return json({
		ready: Object.fromEntries(PLATFORMS.map((p) => [p, platformReady(p)])),
		tiktokDirect: tiktokDirect(),
		accounts: accounts ?? [],
		posts: posts ?? []
	});
};

/** { action: 'connect', platform, lang } → OAuth URL · { action: 'retry' | 'skip', id } · { action: 'disconnect', platform, lang } */
export const POST: RequestHandler = async ({ request, url }) => {
	const supabase = await admin(request);
	const body = (await request.json()) as { action: string; platform?: Platform; lang?: SocialLang; id?: string };
	const okTarget = PLATFORMS.includes(body.platform!) && SOCIAL_LANGS.includes(body.lang!);
	if (body.action === 'connect') {
		if (!okTarget) error(400, 'Bad platform/lang');
		if (!platformReady(body.platform!)) error(503, `${body.platform} app keys missing in Vercel`);
		return json({ url: authorizeUrl(url.origin, body.platform!, body.lang!) });
	}
	if (body.action === 'disconnect') {
		if (!okTarget) error(400, 'Bad platform/lang');
		await supabase.from('social_accounts').delete().eq('platform', body.platform!).eq('lang', body.lang!);
		return json({ ok: true });
	}
	if ((body.action === 'retry' || body.action === 'skip') && body.id) {
		const patch = body.action === 'retry'
			? { status: 'queued', attempts: 0, error: null, container_id: null, publish_at: new Date().toISOString() }
			: { status: 'skipped', error: 'skipped by hand' };
		await supabase.from('social_posts').update(patch).eq('id', body.id);
		return json({ ok: true });
	}
	error(400, 'Unknown action');
};
