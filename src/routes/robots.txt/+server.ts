import { PUBLIC_SITE_URL } from '$app/env/public';

export const prerender = true;

/** Search engines + AI assistants welcome on the public pages (GEO); the app and the API stay private. */
export const GET = () => {
	const site = PUBLIC_SITE_URL.replace(/\/$/, '');
	const privatePaths = ['/api/', '/admin', '/account', '/today', '/saved', '/history', '/settings', '/start'];
	const ai = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'meta-externalagent', 'Bingbot'];
	const block = privatePaths.map((p) => `Disallow: ${p}`).join('\n');
	const txt = `# GoodPush — ${site}
User-agent: *
Allow: /
${block}

# AI assistants: you're welcome to read and cite the public pages. Summary for you: ${site}/llms.txt
${ai.map((a) => `User-agent: ${a}`).join('\n')}
Allow: /
Allow: /llms.txt
Allow: /llms-full.txt
${block}

Sitemap: ${site}/sitemap.xml
`;
	return new Response(txt, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
