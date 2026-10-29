import { error, json } from '@sveltejs/kit';
import { db } from '#lib/server/supabase.ts';
import { quoteToPhrase, type QuoteRow } from '#lib/quotes.ts';
import type { RequestHandler } from './$types';

/** Approved "in the news" quotes published on a given day (public, cached). */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const day = url.searchParams.get('day') ?? '';
	if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) error(400, 'Invalid day');
	const supabase = db();
	if (!supabase) return json({ quotes: [] });
	const { data, error: e } = await supabase
		.from('quotes')
		.select('id,topic,author,quote_en,quote_es,quote_fr,source_url,publish_on')
		.eq('approved', true)
		.eq('publish_on', day)
		.limit(100);
	if (e) {
		console.error('[quotes]', e.message);
		return json({ quotes: [] });
	}
	setHeaders({ 'cache-control': 'public, max-age=300' });
	return json({ quotes: ((data ?? []) as QuoteRow[]).map(quoteToPhrase).filter(Boolean) });
};
