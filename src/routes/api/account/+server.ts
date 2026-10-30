import { error, json } from '@sveltejs/kit';
import { LANGS } from '#lib/data/categories.ts';
import { getUser, isPremium } from '#lib/server/auth.ts';
import { ACTIVE, isDeviceId, stripe } from '#lib/server/stripe.ts';
import { db } from '#lib/server/supabase.ts';
import { captureServer } from '#lib/server/analytics.ts';
import { deleteContact, subscribeContact, unsubscribeContact } from '#lib/server/brevo.ts';
import type { RequestHandler } from './$types';

async function requireUser(request: Request) {
	const supabase = db();
	if (!supabase) error(503, 'Accounts are not configured yet');
	const user = await getUser(request);
	if (!user) error(401, 'Please sign in');
	return { supabase, user };
}

/** Account overview: synced data, devices (with notifications), premium, marketing consent. */
export const GET: RequestHandler = async ({ request, url }) => {
	const { supabase, user } = await requireUser(request);
	const deviceId = url.searchParams.get('deviceId');

	const [{ data: profile }, { data: devices }] = await Promise.all([
		supabase.from('profiles').select('data,lang,marketing_opt_in').eq('user_id', user.id).maybeSingle(),
		supabase
			.from('subscribers')
			.select('id,hour,extra_hours,categories,time_zone,active,paused_until,days,created_at,updated_at')
			.eq('user_id', user.id)
			.order('updated_at', { ascending: false })
	]);

	return json({
		email: user.email,
		provider: user.app_metadata?.provider ?? 'email',
		data: profile?.data ?? null,
		marketing: profile?.marketing_opt_in ?? false,
		devices: devices ?? [],
		premium: await isPremium(isDeviceId(deviceId) ? deviceId : null, user.id)
	});
};

/**
 * Actions:
 *  { action: 'link', deviceId }            → attach this phone (+ its Premium) to the account
 *  { action: 'sync', data, lang }          → save favorites / history / streak / settings
 *  { action: 'marketing', optIn }          → email marketing consent (explicit, GDPR)
 *  { action: 'device', deviceId, active?, pausedUntil? } → on/off or pause one of my phones
 */
export const POST: RequestHandler = async ({ request }) => {
	const { supabase, user } = await requireUser(request);
	const body = await request.json().catch(() => null);
	const now = new Date().toISOString();

	switch (body?.action) {
		case 'link': {
			if (!isDeviceId(body.deviceId)) error(400, 'Invalid device');
			await Promise.all([
				supabase.from('subscribers').update({ user_id: user.id }).eq('id', body.deviceId),
				supabase.from('premium').update({ user_id: user.id }).eq('device_id', body.deviceId).is('user_id', null),
				supabase
					.from('profiles')
					.upsert({ user_id: user.id, email: user.email, updated_at: now }, { onConflict: 'user_id', ignoreDuplicates: true })
			]);
			return json({ ok: true });
		}
		case 'sync': {
			const data = body.data;
			if (!data || typeof data !== 'object' || JSON.stringify(data).length > 200_000) error(400, 'Invalid data');
			await supabase.from('profiles').upsert(
				{
					user_id: user.id,
					email: user.email,
					data,
					lang: LANGS.includes(body.lang) ? body.lang : 'en',
					updated_at: now
				},
				{ onConflict: 'user_id' }
			);
			return json({ ok: true });
		}
		case 'marketing': {
			const optIn = body.optIn === true;
			await supabase.from('profiles').upsert(
				{
					user_id: user.id,
					email: user.email,
					marketing_opt_in: optIn,
					marketing_consent_at: optIn ? now : null,
					updated_at: now
				},
				{ onConflict: 'user_id' }
			);
			// Sync with the email platform (Brevo)
			if (user.email) {
				try {
					if (optIn) {
						const { data: prof } = await supabase.from('profiles').select('lang,data').eq('user_id', user.id).maybeSingle();
						await subscribeContact(user.email, {
							lang: prof?.lang ?? 'en',
							categories: prof?.data?.profile?.categories ?? [],
							premium: await isPremium(null, user.id),
							source: 'account',
							name: prof?.data?.profile?.name || undefined
						});
					} else await unsubscribeContact(user.email);
					await supabase.from('profiles').update({ brevo_synced_at: now }).eq('user_id', user.id);
				} catch (err) {
					console.error('[account] brevo sync', err);
				}
			}
			await captureServer({ event: optIn ? 'marketing_opt_in' : 'marketing_opt_out', distinct_id: user.id });
			return json({ ok: true, optIn });
		}
		case 'device': {
			if (!isDeviceId(body.deviceId)) error(400, 'Invalid device');
			const patch: Record<string, unknown> = {};
			if (typeof body.active === 'boolean') patch.active = body.active;
			if (body.pausedUntil === null || (typeof body.pausedUntil === 'string' && !Number.isNaN(Date.parse(body.pausedUntil))))
				patch.paused_until = body.pausedUntil ? new Date(body.pausedUntil).toISOString() : null;
			const { error: e } = await supabase
				.from('subscribers')
				.update(patch)
				.eq('id', body.deviceId)
				.eq('user_id', user.id);
			if (e) error(500, e.message);
			return json({ ok: true });
		}
		default:
			error(400, 'Unknown action');
	}
};

/** Delete my account: cancels Premium, removes devices, synced data and the login. */
export const DELETE: RequestHandler = async ({ request }) => {
	const { supabase, user } = await requireUser(request);
	const s = stripe();
	const { data: subs } = await supabase.from('premium').select('stripe_subscription_id,status').eq('user_id', user.id);
	if (s) {
		for (const p of subs ?? []) {
			if (p.stripe_subscription_id && ACTIVE.includes(p.status)) {
				await s.subscriptions.cancel(p.stripe_subscription_id).catch((e) => console.error('[account] cancel', e));
			}
		}
	}
	await supabase.from('subscribers').delete().eq('user_id', user.id);
	await supabase.from('profiles').delete().eq('user_id', user.id);
	if (user.email) await deleteContact(user.email).catch(() => {});
	await supabase.auth.admin.deleteUser(user.id);
	await captureServer({ event: 'account_deleted', distinct_id: user.id });
	return json({ ok: true });
};
