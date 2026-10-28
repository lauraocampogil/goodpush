import { PUBLIC_SITE_URL } from '$app/env/public';

export const prerender = true;

export const GET = () => {
	const pages = ['/', '/premium', '/privacy', '/terms'];
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${PUBLIC_SITE_URL}${p}</loc></url>`).join('\n')}
</urlset>`;
	return new Response(xml, { headers: { 'content-type': 'application/xml' } });
};
