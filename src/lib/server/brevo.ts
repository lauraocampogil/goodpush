import { BREVO_API_KEY, BREVO_DOI_TEMPLATE_ID, BREVO_LIST_ID } from '$app/env/private';

/**
 * Brevo (EU email platform) — the email-marketing audience lives here.
 * Only people who explicitly opted in are added. Brevo adds the unsubscribe link to every campaign.
 * Contact attributes to create in Brevo (Contacts → Settings → Attributes):
 *   LANGUAGE (text), CATEGORIES (text), PREMIUM (boolean), SOURCE (text) — FIRSTNAME exists by default
 * The weekly newsletter goes to one list per language ("GoodPush EN/ES/FR"), created automatically.
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

export type ContactAttrs = { lang?: string; categories?: string[]; premium?: boolean; source?: string; name?: string };
const attributes = (a: ContactAttrs) => ({
	...(a.lang ? { LANGUAGE: a.lang } : {}),
	...(a.categories ? { CATEGORIES: a.categories.join(',') } : {}),
	...(a.premium !== undefined ? { PREMIUM: a.premium } : {}),
	...(a.source ? { SOURCE: a.source } : {}),
	...(a.name ? { FIRSTNAME: a.name } : {})
});

/** Account user ticked the box → add / update in the list (consent already given in-app). */
export async function subscribeContact(email: string, a: ContactAttrs) {
	if (!brevoReady()) return;
	const lists = await langLists();
	const mine = lists[(a.lang as Lang) ?? 'en'] ?? lists.en;
	await call('/contacts', 'POST', {
		email,
		attributes: attributes(a),
		listIds: [Number(BREVO_LIST_ID), mine].filter(Boolean),
		updateEnabled: true,
		emailBlacklisted: false
	});
	// Language changed → leave the other language lists
	const others = Object.values(lists).filter((id) => id && id !== mine);
	for (const id of others) await call(`/contacts/lists/${id}/contacts/remove`, 'POST', { emails: [email] }).catch(() => {});
}

type Lang = 'en' | 'es' | 'fr';
let listCache: Record<Lang, number> | null = null;

/** One Brevo list per language (created next to your main list the first time). */
export async function langLists(): Promise<Record<Lang, number>> {
	if (listCache) return listCache;
	const all = (await (await call('/contacts/lists?limit=50', 'GET')).json()) as { lists?: { id: number; name: string }[] };
	const found = Object.fromEntries((all.lists ?? []).map((l) => [l.name, l.id]));
	const main = (await (await call(`/contacts/lists/${BREVO_LIST_ID}`, 'GET')).json()) as { folderId?: number };
	const out = {} as Record<Lang, number>;
	for (const l of ['en', 'es', 'fr'] as Lang[]) {
		const name = `GoodPush ${l.toUpperCase()}`;
		out[l] =
			found[name] ??
			((await (await call('/contacts/lists', 'POST', { name, folderId: main.folderId ?? 1 })).json()) as { id: number }).id;
	}
	return (listCache = out);
}

/** Creates a campaign for one language list and sends it now. Returns the campaign id. */
export async function sendCampaign(o: { name: string; subject: string; preview: string; html: string; listId: number; senderEmail: string }) {
	const res = await call('/emailCampaigns', 'POST', {
		name: o.name,
		subject: o.subject,
		previewText: o.preview,
		sender: { name: 'GoodPush', email: o.senderEmail },
		htmlContent: o.html,
		recipients: { listIds: [o.listId] },
		inlineImageActivation: false
	});
	const { id } = (await res.json()) as { id: number };
	await call(`/emailCampaigns/${id}/sendNow`, 'POST');
	return id;
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
