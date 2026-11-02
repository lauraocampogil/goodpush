import { redirect } from '@sveltejs/kit';
import { db } from '#lib/server/supabase.ts';
import { exchangeCode, readState } from '#lib/server/social.ts';
import type { RequestHandler } from './$types';

/** OAuth return from Instagram / TikTok. The signed `state` proves it started from /admin/social. */
export const GET: RequestHandler = async ({ url, params }) => {
	const state = readState(url.searchParams.get('state'));
	const code = url.searchParams.get('code');
	const back = (q: string) => redirect(303, `/admin/social?${q}`);
	if (!state || state.platform !== params.platform) back('error=' + encodeURIComponent('Link expired — try again'));
	if (!code) back('error=' + encodeURIComponent(url.searchParams.get('error_description') ?? url.searchParams.get('error') ?? 'Cancelled'));
	const supabase = db();
	if (!supabase) back('error=Supabase');
	let msg: string;
	try {
		const acc = await exchangeCode(url.origin, state!.platform, state!.lang, code!);
		const { error } = await supabase!.from('social_accounts').upsert({ ...acc, updated_at: new Date().toISOString() });
		if (error) throw new Error(error.message);
		msg = `ok=${state!.platform}-${state!.lang}`;
	} catch (e) {
		msg = 'error=' + encodeURIComponent((e as Error).message.slice(0, 200));
	}
	back(msg);
	return new Response(null);
};
