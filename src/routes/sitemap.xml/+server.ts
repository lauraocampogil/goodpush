import { PUBLIC_SITE_URL } from '$app/env/public';
import { LANGS } from '#lib/data/categories.ts';

export const prerender = true;

/** Every public page in every language (?lang=xx), with hreflang alternates. */
export const GET = () => {
	const site = PUBLIC_SITE_URL.replace(/\/$/, '');
	const pages: [string, string, string][] = [['/', 'weekly', '1.0'], ['/premium', 'monthly', '0.8'], ['/privacy', 'yearly', '0.3'], ['/terms', 'yearly', '0.3']];
	const today = new Date().toISOString().slice(0, 10);
	const alt = (p: string) =>
		[...LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${site}${p}?lang=${l}"/>`), `    <xhtml:link rel="alternate" hreflang="x-default" href="${site}${p}"/>`].join('\n');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages
	.flatMap(([p, freq, prio]) => LANGS.map((l) => `  <url>\n    <loc>${site}${p}?lang=${l}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n${alt(p)}\n  </url>`))
	.join('\n')}
</urlset>`;
	return new Response(xml, { headers: { 'content-type': 'application/xml' } });
};
