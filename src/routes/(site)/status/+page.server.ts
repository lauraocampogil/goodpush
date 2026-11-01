import { healthChecks } from '#lib/server/health.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store', 'x-robots-tag': 'noindex' });
	return { checks: await healthChecks(), at: new Date().toISOString() };
};
