import { error, json } from '@sveltejs/kit';
import { CRON_SECRET } from '$app/env/private';
import { PUBLIC_CONTACT_EMAIL } from '$app/env/public';
import { LANGS, type Lang } from '#lib/data/categories.ts';
import { captureServer } from '#lib/server/analytics.ts';
import { brevoReady, langLists, sendCampaign } from '#lib/server/brevo.ts';
import { buildIssue, renderIssue, subject, weekKey } from '#lib/server/newsletter.ts';
import { db } from '#lib/server/supabase.ts';
import type { RequestHandler } from './$types';

export const config = { maxDuration: 120 };

/**
 * Weekly (Sunday ~09:00 Brussels): builds "The Good Weekly" and sends one Brevo campaign per language.
 *   ?preview=es   → returns the HTML (nothing is sent)
 *   ?force        → send again even if this week was already sent
 */
export const GET: RequestHandler = async ({ request, url }) => {
	if (!CRON_SECRET || request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) error(401, 'Unauthorized');
	const supabase = db();
	const week = weekKey();
	const issue = await buildIssue(supabase, week);

	const preview = url.searchParams.get('preview') as Lang | null;
	if (preview) {
		if (!LANGS.includes(preview)) error(400, 'Unknown language');
		return new Response(renderIssue(issue, preview), { headers: { 'content-type': 'text/html; charset=utf-8' } });
	}

	if (!supabase || !brevoReady()) error(503, 'Supabase or Brevo not configured');
	const { data: already } = await supabase.from('newsletter_issues').select('week').eq('week', week).maybeSingle();
	if (already && !url.searchParams.has('force')) return json({ ok: true, week, skipped: 'already sent' });

	const lists = await langLists();
	const campaigns: Partial<Record<Lang, number | string>> = {};
	for (const lang of LANGS) {
		try {
			campaigns[lang] = await sendCampaign({
				name: `The Good Weekly #${issue.number} (${lang.toUpperCase()}) — ${week}`,
				subject: subject(lang),
				preview: issue.tip.title[lang],
				html: renderIssue(issue, lang),
				listId: lists[lang],
				senderEmail: PUBLIC_CONTACT_EMAIL
			});
		} catch (err) {
			campaigns[lang] = `error: ${(err as Error).message}`;
		}
	}
	await supabase.from('newsletter_issues').upsert({ week, number: issue.number, phrase_id: issue.phrase.id, campaigns, sent_at: new Date().toISOString() });
	await captureServer([{ event: 'newsletter_sent', distinct_id: 'goodpush-cron', properties: { week, number: issue.number, campaigns } }]);
	return json({ ok: true, week, number: issue.number, campaigns });
};
