import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
	ADMIN_EMAILS,
	CRON_SECRET,
	INSTAGRAM_APP_ID,
	INSTAGRAM_APP_SECRET,
	TIKTOK_CLIENT_KEY,
	TIKTOK_CLIENT_SECRET,
	TIKTOK_DIRECT
} from '$app/env/private';
import type { User } from '@supabase/supabase-js';

/**
 * Automatic publishing to Instagram (Instagram API with Instagram Login) and TikTok (Content Posting API).
 * One account per platform × language. Tokens never leave the server.
 */
export type Platform = 'instagram' | 'tiktok';
export const PLATFORMS: Platform[] = ['instagram', 'tiktok'];
export const SOCIAL_LANGS = ['en', 'es', 'fr'] as const;
export type SocialLang = (typeof SOCIAL_LANGS)[number];
/** Accounts that exist today (the website keeps every language). Add 'fr' when @goodpush.fr opens. */
export const ACTIVE_SOCIAL_LANGS: SocialLang[] = ['en', 'es'];

export type Account = {
	platform: Platform;
	lang: SocialLang;
	external_id: string | null;
	username: string | null;
	access_token: string;
	refresh_token: string | null;
	expires_at: string | null;
	refresh_expires_at: string | null;
};
export type Post = {
	id: string;
	platform: Platform;
	lang: SocialLang;
	post_date: string;
	slot: string;
	format: string;
	kind: 'video' | 'carousel';
	media: string[];
	caption: string;
	publish_at: string;
	status: string;
	container_id: string | null;
	attempts: number;
};

const IG = 'https://graph.instagram.com/v24.0';
const TT = 'https://open.tiktokapis.com/v2';

export const platformReady = (p: Platform) => (p === 'instagram' ? !!(INSTAGRAM_APP_ID && INSTAGRAM_APP_SECRET) : !!(TIKTOK_CLIENT_KEY && TIKTOK_CLIENT_SECRET));
export const tiktokDirect = () => !!TIKTOK_DIRECT;

export function isAdmin(user: User | null) {
	const list = (ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
	return !!user?.email && list.includes(user.email.toLowerCase());
}

// ---------- OAuth state (signed, 15 min) ----------
const sign = (s: string) => createHmac('sha256', CRON_SECRET ?? 'dev').update(s).digest('base64url');
export function makeState(platform: Platform, lang: SocialLang) {
	const body = Buffer.from(JSON.stringify({ platform, lang, exp: Date.now() + 15 * 60_000, n: randomBytes(6).toString('hex') })).toString('base64url');
	return `${body}.${sign(body)}`;
}
export function readState(state: string | null): { platform: Platform; lang: SocialLang } | null {
	const [body, mac] = (state ?? '').split('.');
	if (!body || !mac) return null;
	const a = Buffer.from(sign(body)), b = Buffer.from(mac);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
	const s = JSON.parse(Buffer.from(body, 'base64url').toString());
	return s.exp > Date.now() ? s : null;
}

export const redirectUri = (origin: string, p: Platform) => `${origin}/api/social/callback/${p}`;

export function authorizeUrl(origin: string, platform: Platform, lang: SocialLang) {
	const state = makeState(platform, lang);
	if (platform === 'instagram') {
		return `https://www.instagram.com/oauth/authorize?${new URLSearchParams({
			force_reauth: 'true', // pick the right account for each language
			force_authentication: '1',
			client_id: INSTAGRAM_APP_ID!,
			redirect_uri: redirectUri(origin, 'instagram'),
			response_type: 'code',
			scope: 'instagram_business_basic,instagram_business_content_publish',
			state
		})}`;
	}
	return `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({
		client_key: TIKTOK_CLIENT_KEY!,
		scope: TIKTOK_DIRECT ? 'user.info.basic,video.upload,video.publish' : 'user.info.basic,video.upload',
		response_type: 'code',
		redirect_uri: redirectUri(origin, 'tiktok'),
		state,
		disable_auto_auth: '1'
	})}`;
}

async function j<T>(res: Response, what: string): Promise<T> {
	const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
	const e = body.error as string | { code?: string | number; message?: string } | undefined;
	// Instagram: { error: { message, code } } · TikTok API: { error: { code: 'ok' | … } } · TikTok OAuth: { error, error_description }
	let msg: string | null = null;
	if (typeof e === 'string') msg = (body.error_description as string) || e;
	else if (e && typeof e === 'object' && e.code !== 'ok') msg = e.message || String(e.code);
	if (!res.ok && !msg) msg = `HTTP ${res.status}`;
	if (msg) throw new Error(`${what}: ${msg}`);
	return body as T;
}
const iso = (secondsFromNow?: number) => (secondsFromNow ? new Date(Date.now() + secondsFromNow * 1000).toISOString() : null);

/** Exchange the OAuth code → long-lived account row. */
export async function exchangeCode(origin: string, platform: Platform, lang: SocialLang, code: string): Promise<Account> {
	if (platform === 'instagram') {
		const short = await j<{ access_token: string; user_id: string | number }>(
			await fetch('https://api.instagram.com/oauth/access_token', {
				method: 'POST',
				body: new URLSearchParams({ client_id: INSTAGRAM_APP_ID!, client_secret: INSTAGRAM_APP_SECRET!, grant_type: 'authorization_code', redirect_uri: redirectUri(origin, 'instagram'), code: code.replace(/#_$/, '') })
			}),
			'Instagram code'
		);
		const long = await j<{ access_token: string; expires_in: number }>(
			await fetch(`https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: INSTAGRAM_APP_SECRET!, access_token: short.access_token })}`),
			'Instagram long-lived token'
		);
		const me = await j<{ user_id?: string; id: string; username: string }>(await fetch(`${IG}/me?fields=user_id,username&access_token=${long.access_token}`), 'Instagram profile');
		return { platform, lang, external_id: String(me.user_id ?? me.id ?? short.user_id), username: me.username, access_token: long.access_token, refresh_token: null, expires_at: iso(long.expires_in), refresh_expires_at: null };
	}
	const t = await j<{ access_token: string; expires_in: number; open_id: string; refresh_token: string; refresh_expires_in: number }>(
		await fetch(`${TT}/oauth/token/`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ client_key: TIKTOK_CLIENT_KEY!, client_secret: TIKTOK_CLIENT_SECRET!, code, grant_type: 'authorization_code', redirect_uri: redirectUri(origin, 'tiktok') })
		}),
		'TikTok code'
	);
	const me = await j<{ data: { user: { display_name?: string; username?: string } } }>(
		await fetch(`${TT}/user/info/?fields=open_id,display_name,username`, { headers: { authorization: `Bearer ${t.access_token}` } }),
		'TikTok profile'
	).catch(() => ({ data: { user: {} as { display_name?: string; username?: string } } }));
	return { platform, lang, external_id: t.open_id, username: me.data.user.username ?? me.data.user.display_name ?? null, access_token: t.access_token, refresh_token: t.refresh_token, expires_at: iso(t.expires_in), refresh_expires_at: iso(t.refresh_expires_in) };
}

/** Keep tokens alive: TikTok every day (24 h tokens), Instagram when < 10 days are left (60-day tokens). */
export async function refreshIfNeeded(db: SupabaseClient, a: Account): Promise<Account> {
	const left = a.expires_at ? Date.parse(a.expires_at) - Date.now() : Infinity;
	let next: Partial<Account> | null = null;
	if (a.platform === 'tiktok' && left < 2 * 3600_000 && a.refresh_token) {
		const t = await j<{ access_token: string; expires_in: number; refresh_token: string; refresh_expires_in: number }>(
			await fetch(`${TT}/oauth/token/`, {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ client_key: TIKTOK_CLIENT_KEY!, client_secret: TIKTOK_CLIENT_SECRET!, grant_type: 'refresh_token', refresh_token: a.refresh_token })
			}),
			'TikTok refresh'
		);
		next = { access_token: t.access_token, refresh_token: t.refresh_token, expires_at: iso(t.expires_in), refresh_expires_at: iso(t.refresh_expires_in) };
	} else if (a.platform === 'instagram' && left < 10 * 86400_000) {
		const t = await j<{ access_token: string; expires_in: number }>(
			await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${a.access_token}`),
			'Instagram refresh'
		);
		next = { access_token: t.access_token, expires_at: iso(t.expires_in) };
	}
	if (!next) return a;
	await db.from('social_accounts').update({ ...next, updated_at: new Date().toISOString() }).eq('platform', a.platform).eq('lang', a.lang);
	return { ...a, ...next };
}

// ---------- Instagram ----------
async function igPost<T>(a: Account, path: string, params: Record<string, string>) {
	return j<T>(await fetch(`${IG}/${path}`, { method: 'POST', body: new URLSearchParams({ ...params, access_token: a.access_token }) }), `Instagram ${path.split('/').pop()}`);
}
/** Step 1: create the media container (Instagram downloads + processes the file). */
async function igCreate(a: Account, p: Post): Promise<string> {
	if (p.kind === 'video') {
		return (await igPost<{ id: string }>(a, `${a.external_id}/media`, { media_type: 'REELS', video_url: p.media[0], caption: p.caption, share_to_feed: 'true' })).id;
	}
	const children: string[] = [];
	for (const url of p.media) children.push((await igPost<{ id: string }>(a, `${a.external_id}/media`, { image_url: url, is_carousel_item: 'true' })).id);
	return (await igPost<{ id: string }>(a, `${a.external_id}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: p.caption })).id;
}
/** Step 2 (a few minutes later): publish when Instagram says FINISHED. */
async function igCheck(a: Account, p: Post): Promise<Partial<Post> & { status: string; external_id?: string; error?: string }> {
	const s = await j<{ status_code: string; status?: string }>(await fetch(`${IG}/${p.container_id}?fields=status_code,status&access_token=${a.access_token}`), 'Instagram status');
	if (s.status_code === 'FINISHED') {
		const r = await igPost<{ id: string }>(a, `${a.external_id}/media_publish`, { creation_id: p.container_id! });
		return { status: 'published', external_id: r.id };
	}
	if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') return { status: 'failed', error: s.status ?? s.status_code };
	return { status: 'processing' };
}

// ---------- TikTok ----------
async function ttPost<T>(a: Account, path: string, body: unknown) {
	return j<T>(await fetch(`${TT}/${path}`, { method: 'POST', headers: { authorization: `Bearer ${a.access_token}`, 'content-type': 'application/json; charset=UTF-8' }, body: JSON.stringify(body) }), `TikTok ${path}`);
}
/** Uploads the video. Without the audit it lands in the account's TikTok inbox as a draft (tap → Post). */
async function ttCreate(a: Account, p: Post): Promise<string> {
	const file = await fetch(p.media[0]);
	if (!file.ok) throw new Error(`video download ${file.status}`);
	const video = new Uint8Array(await file.arrayBuffer());
	const source_info = { source: 'FILE_UPLOAD', video_size: video.length, chunk_size: video.length, total_chunk_count: 1 };
	let init: { data: { publish_id: string; upload_url: string } };
	if (TIKTOK_DIRECT) {
		const info = await ttPost<{ data: { privacy_level_options: string[] } }>(a, 'post/publish/creator_info/query/', {});
		const privacy = info.data.privacy_level_options.includes('PUBLIC_TO_EVERYONE') ? 'PUBLIC_TO_EVERYONE' : info.data.privacy_level_options[0];
		init = await ttPost(a, 'post/publish/video/init/', {
			post_info: { title: p.caption.slice(0, 2200), privacy_level: privacy, disable_comment: false, disable_duet: false, disable_stitch: false, video_cover_timestamp_ms: 4000 },
			source_info
		});
	} else {
		init = await ttPost(a, 'post/publish/inbox/video/init/', { source_info });
	}
	const up = await fetch(init.data.upload_url, {
		method: 'PUT',
		headers: { 'content-type': 'video/mp4', 'content-length': String(video.length), 'content-range': `bytes 0-${video.length - 1}/${video.length}` },
		body: video
	});
	if (!up.ok) throw new Error(`TikTok upload ${up.status}`);
	return init.data.publish_id;
}
async function ttCheck(a: Account, p: Post): Promise<{ status: string; external_id?: string; error?: string }> {
	const s = await ttPost<{ data: { status: string; fail_reason?: string; publicaly_available_post_id?: (string | number)[] } }>(a, 'post/publish/status/fetch/', { publish_id: p.container_id });
	if (s.data.status === 'PUBLISH_COMPLETE') return { status: 'published', external_id: String(s.data.publicaly_available_post_id?.[0] ?? '') };
	if (s.data.status === 'SEND_TO_USER_INBOX') return { status: 'draft' };
	if (s.data.status === 'FAILED') return { status: 'failed', error: s.data.fail_reason ?? 'failed' };
	return { status: 'processing' };
}

export const createPost = (a: Account, p: Post) => (p.platform === 'instagram' ? igCreate(a, p) : ttCreate(a, p));
export const checkPost = (a: Account, p: Post) => (p.platform === 'instagram' ? igCheck(a, p) : ttCheck(a, p));
