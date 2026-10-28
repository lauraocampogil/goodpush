import type { Handle } from '@sveltejs/kit/hooks';
import { pickLang } from '#lib/i18n/index.svelte.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const lang = pickLang(event.cookies.get('lang'), event.request.headers.get('accept-language'));
	event.locals.lang = lang;
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};
