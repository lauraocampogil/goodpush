import { BREVO_API_KEY, BREVO_DOI_TEMPLATE_ID, BREVO_LIST_ID } from '$app/env/private';

/**
 * Brevo (EU email platform) — the email-marketing audience lives here.
 * Only people who explicitly opted in are added. Brevo adds the unsubscribe link to every campaign.
 * Contact attributes to create in Brevo (Contacts → Settings → Attributes):
 *   LANGUAGE (text), CATEGORIES (text), PREMIUM (boolean), SOURCE (text)
 */
const API = 'https://api.brevo.com/v3';
export const brevoReady = () => !!(BREVO_API_KEY && BREVO_LIST_ID);

async function call(path: string, method: string, body?: unknown) {
	const res = await fetch(`${API}${path}`, {
		method,
		headers: { 'api-key': BREVO_API_KEY!, 'content-type': 'application/json', accept: 'application/json' },
		body: body ? JSON.stringify(body) : undefined
	});
	if (!res.ok && res.status !== 404) {
		console.error('[brevo]', method, path, res.status, await res.text().catch(() => ''));
		throw new Error(`Brevo ${res.status}`);
	}
	return res;
}

export type ContactAttrs = { lang?: string; categories?: string[]; premium?: boolean; source?: string };
const attributes = (a: ContactAttrs) => ({
	...(a.lang ? { LANGUAGE: a.lang } : {}),
	...(a.categories ? { CATEGORIES: a.categories.join(',') } : {}),
	...(a.premium !== undefined ? { PREMIUM: a.premium } : {}),
	...(a.source ? { SOURCE: a.source } : {})
});

/** Account user ticked the box → add / update in the list (consent already given in-app). */
export async function subscribeContact(email: string, a: ContactAttrs) {
	if (!brevoReady()) return;
	await call('/contacts', 'POST', {
		email,
		attributes: attributes(a),
		listIds: [Number(BREVO_LIST_ID)],
		updateEnabled: true,
		emailBlacklisted: false
	});
}

/** Footer newsletter form → double opt-in email first (best practice, proves consent). */
export async function doubleOptIn(email: string, a: ContactAttrs, redirectionUrl: string) {
	if (!brevoReady()) return;
	if (!BREVO_DOI_TEMPLATE_ID) return subscribeContact(email, a);
	await call('/contacts/doubleOptinConfirmation', 'POST', {
		email,
		attributes: attributes(a),
		includeListIds: [Number(BREVO_LIST_ID)],
		templateId: Number(BREVO_DOI_TEMPLATE_ID),
		redirectionUrl
	});
}

/** Opt-out → remove from the marketing list. */
export async function unsubscribeContact(email: string) {
	if (!brevoReady()) return;
	await call(`/contacts/lists/${BREVO_LIST_ID}/contacts/remove`, 'POST', { emails: [email] });
}

/** Account deleted → delete the contact entirely (GDPR). */
export async function deleteContact(email: string) {
	if (!brevoReady()) return;
	await call(`/contacts/${encodeURIComponent(email)}`, 'DELETE');
}
