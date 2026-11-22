// Real footage for the videos. Order of preference:
//   1. your own clips: marketing/clips/<date>_<slot>.mp4 or marketing/clips/<theme>/*.mp4
//   2. Pixabay (PIXABAY_API_KEY) or Pexels (PEXELS_API_KEY) — both free for commercial use, no attribution required.
// Returns { file, credit } or null (the video then uses the branded background).
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const QUERIES = {
	discipline: ['early morning run', 'boxing training', 'athlete training stairs', 'sunrise runner city'],
	study: ['studying library', 'writing notes desk', 'student laptop night', 'reading book coffee'],
	calm: ['ocean waves', 'forest sunlight', 'rain window', 'clouds timelapse'],
	sport: ['football training', 'running track athlete', 'basketball court', 'gym workout', 'tennis player', 'cyclist road'],
	build: ['city night timelapse', 'working laptop night', 'skyscrapers sunrise', 'team brainstorming'],
	selflove: ['woman smiling sunlight', 'flowers sunlight', 'walking beach sunset', 'dancing alone'],
	faith: ['sunrise mountains', 'sky light rays', 'candle light', 'sunset field']
};

const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);


// ---------- stock providers ----------
/** → [{ id, duration, url, user, provider }] for a query; portrait or landscape preferred. */
async function search(query, orientation) {
	const out = [];
	const pixabay = process.env.PIXABAY_API_KEY;
	if (pixabay) {
		const res = await fetch(`https://pixabay.com/api/videos/?${new URLSearchParams({ key: pixabay, q: query, per_page: '40', safesearch: 'true' })}`);
		if (res.ok) {
			const { hits = [] } = await res.json();
			for (const h of hits) {
				const files = Object.values(h.videos ?? {}).filter((f) => f?.url && f.width);
				const want = files.filter((f) => (orientation === 'portrait' ? f.height >= 1280 || f.width >= 1280 : f.width >= 1280)).sort((a, b) => a.width - b.width)[0] ?? files.sort((a, b) => b.width - a.width)[0];
				if (!want || h.duration < 4) continue;
				const portrait = want.height > want.width;
				out.push({ id: `pb${h.id}`, duration: h.duration, url: want.url, user: h.user, provider: 'Pixabay', score: orientation === 'portrait' ? (portrait ? 0 : 1) : portrait ? 1 : 0 });
			}
		} else console.warn(`Pixabay ${res.status} for "${query}"`);
	}
	const pexels = process.env.PEXELS_API_KEY;
	if (pexels && out.length < 5) {
		const res = await fetch(`https://api.pexels.com/videos/search?${new URLSearchParams({ query, orientation, size: 'medium', per_page: '30' })}`, { headers: { Authorization: pexels } });
		if (res.ok) {
			const { videos = [] } = await res.json();
			for (const v of videos) {
				const files = v.video_files.filter((x) => x.file_type === 'video/mp4');
				const f = files.filter((x) => (orientation === 'portrait' ? x.height >= 1280 && x.height > x.width : x.width >= 1280 && x.width > x.height)).sort((a, b) => a.width - b.width)[0] ?? files[0];
				if (f && v.duration >= 4) out.push({ id: `px${v.id}`, duration: v.duration, url: f.link, user: v.user?.name, provider: 'Pexels', score: 0 });
			}
		} else console.warn(`Pexels ${res.status} for "${query}"`);
	}
	return out.sort((a, b) => a.score - b.score);
}
const hasStock = () => !!(process.env.PIXABAY_API_KEY || process.env.PEXELS_API_KEY);

/** n different clips for these queries, downloaded once into marketing/clips/stock. */
async function stockClips(queries, seed, root, n, orientation) {
	if (!hasStock()) return [];
	const cache = join(root, 'marketing', 'clips', 'stock');
	mkdirSync(cache, { recursive: true });
	const out = [], seen = new Set();
	for (let i = 0; out.length < n && i < n * 3; i++) {
		const query = queries[(hash(seed) + i) % queries.length];
		const pool = (await search(query, orientation).catch(() => [])).filter((v) => !seen.has(v.id));
		if (!pool.length) continue;
		const best = pool.filter((v) => v.score === pool[0].score);
		const v = best[(hash(seed + i) >>> 3) % best.length];
		seen.add(v.id);
		const file = join(cache, `${v.id}.mp4`);
		if (!existsSync(file)) {
			const r = await fetch(v.url);
			if (!r.ok) continue;
			writeFileSync(file, Buffer.from(await r.arrayBuffer()));
		}
		out.push({ file, credit: v.user ? `${v.user} / ${v.provider}` : v.provider });
	}
	return out;
}

function ownClips(job, root, n) {
	const dir = join(root, 'marketing', 'clips', job.theme);
	if (!existsSync(dir)) return [];
	const files = readdirSync(dir).filter((f) => f.endsWith('.mp4')).sort();
	const h = hash(job.date + job.slot);
	return Array.from({ length: Math.min(n, files.length) }, (_, i) => ({ file: join(dir, files[(h + i) % files.length]), credit: null }));
}

/** One clip (format R). */
export async function clipFor(job, root) {
	const own = join(root, 'marketing', 'clips', `${job.date}_${job.slot.toLowerCase()}.mp4`);
	if (existsSync(own)) return { file: own, credit: null };
	const mine = ownClips(job, root, 1);
	if (mine.length) return mine[0];
	return (await stockClips(QUERIES[job.theme] ?? ['sunrise'], job.date + job.slot, root, 1, 'portrait'))[0] ?? null;
}

/** Several clips for a fast-cut video (format K): your clips first, then stock. */
export async function clipsFor(job, root, n = 5) {
	const out = ownClips(job, root, n);
	if (out.length >= n) return out;
	return [...out, ...(await stockClips(QUERIES[job.theme] ?? ['sunrise'], job.date + job.slot, root, n - out.length, 'portrait'))];
}

// ---------- landscape footage for the "quote" formats (Q = cinematic cuts, S = satisfying loop) ----------
export const CINE = {
	discipline: ['runner sunrise slow motion', 'boxer training dark gym', 'mountain climber summit', 'athlete stairs night'],
	study: ['library books slow motion', 'writing pen paper close up', 'night city window desk', 'old books candle'],
	calm: ['ocean waves aerial', 'fog forest morning', 'rain on window night', 'lake mountains sunrise'],
	sport: ['football stadium night', 'sprinter starting blocks', 'swimmer underwater', 'basketball slow motion'],
	build: ['city timelapse night aerial', 'construction crane sunset', 'ship sea storm', 'road trip highway sunset'],
	selflove: ['woman walking field sunset', 'person standing cliff ocean', 'sunlight through trees', 'flowers wind slow motion'],
	faith: ['sun rays clouds', 'starry night sky timelapse', 'ancient statue', 'mountain sunrise clouds']
};
export const SATISFY = ['dominoes falling', 'kinetic sand cutting', 'paint mixing', 'marble run', 'colored pencils falling', 'slime satisfying', 'soap cutting', 'liquid ink in water', 'pottery wheel'];

/** n landscape clips for these queries (formats Q and S). */
export async function landscapeClips(queries, seed, root, n = 1) {
	return stockClips(queries, seed, root, n, 'landscape');
}

// ---------- happy real-life footage for format J (@legat.matteo style) ----------
export const JOY = ['people dancing street', 'friends dancing night city', 'woman dancing street happy', 'man dancing street', 'friends laughing together', 'girl dancing happy', 'dancing in the rain', 'couple dancing city', 'happy friends running beach', 'people celebrating street', 'dancing on the street night', 'friends having fun outdoors'];
/** n portrait clips of people being happy / dancing (your own clips in marketing/clips/joy first). */
export async function joyClips(seed, root, n = 2) {
	const own = ownClips({ theme: 'joy', date: seed, slot: '' }, root, n);
	if (own.length >= n) return own;
	return [...own, ...(await stockClips(JOY, seed, root, n - own.length, 'portrait'))];
}
