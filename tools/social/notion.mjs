// Minimal Notion API client for the "GoodPush — Social Studio" Posts database.
const API = 'https://api.notion.com/v1';
export const POSTS_DB = process.env.NOTION_POSTS_DB || 'aedfb9bd36d44430b9b92c050cb081e5';

async function call(method, path, body) {
	const token = process.env.NOTION_TOKEN;
	if (!token) throw new Error('Set NOTION_TOKEN (Notion integration with access to "GoodPush — Social Studio")');
	for (let attempt = 0; attempt < 4; attempt++) {
		const res = await fetch(API + path, {
			method,
			headers: { authorization: `Bearer ${token}`, 'notion-version': '2022-06-28', 'content-type': 'application/json' },
			body: body ? JSON.stringify(body) : undefined
		});
		if (res.status === 429) { await new Promise((r) => setTimeout(r, 1500 * (attempt + 1))); continue; }
		const json = await res.json();
		if (!res.ok) throw new Error(`Notion ${res.status}: ${json.message}`);
		return json;
	}
	throw new Error('Notion rate limit');
}

export async function queryPosts(filter) {
	const out = [];
	let cursor;
	do {
		const r = await call('POST', `/databases/${POSTS_DB}/query`, { filter, page_size: 100, start_cursor: cursor });
		out.push(...r.results);
		cursor = r.has_more ? r.next_cursor : undefined;
	} while (cursor);
	return out;
}

export const createPost = (properties) => call('POST', '/pages', { parent: { database_id: POSTS_DB }, properties });
export const updatePost = (id, properties) => call('PATCH', `/pages/${id}`, { properties });

// ---- property helpers ----
const chunks = (s) => (s.match(/[\s\S]{1,1900}/g) ?? ['']).map((c) => ({ type: 'text', text: { content: c } }));
export const P = {
	title: (s) => ({ title: chunks(s) }),
	text: (s) => ({ rich_text: s ? chunks(s) : [] }),
	select: (s) => ({ select: s ? { name: s } : null }),
	multi: (a) => ({ multi_select: a.map((name) => ({ name })) }),
	status: (s) => ({ status: { name: s } }),
	date: (iso) => ({ date: { start: iso } }),
	url: (s) => ({ url: s || null })
};
export const read = {
	text: (p) => (p?.rich_text ?? p?.title ?? []).map((t) => t.plain_text).join(''),
	select: (p) => p?.select?.name ?? null,
	multi: (p) => (p?.multi_select ?? []).map((o) => o.name),
	status: (p) => p?.status?.name ?? null,
	date: (p) => p?.date?.start ?? null
};
