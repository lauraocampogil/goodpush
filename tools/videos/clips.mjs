// Real footage for format R. Order of preference:
//   1. your own clip: marketing/clips/<date>_<slot>.mp4 (e.g. 2026-12-07_evening.mp4) or marketing/clips/<theme>/*.mp4
//   2. Pexels (free for commercial use, no attribution required — we credit anyway) when PEXELS_API_KEY is set
// Returns { file, credit } or null (then the video falls back to format D).
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

export async function clipFor(job, root) {
	const dir = join(root, 'marketing', 'clips');
	const own = join(dir, `${job.date}_${job.slot.toLowerCase()}.mp4`);
	if (existsSync(own)) return { file: own, credit: null };
	const themeDir = join(dir, job.theme);
	if (existsSync(themeDir)) {
		const files = readdirSync(themeDir).filter((f) => f.endsWith('.mp4')).sort();
		if (files.length) return { file: join(themeDir, files[hash(job.date + job.slot) % files.length]), credit: null };
	}
	const key = process.env.PEXELS_API_KEY;
	if (!key) return null;
	const qs = QUERIES[job.theme] ?? ['sunrise'];
	const h = hash(job.date + job.slot);
	const query = qs[h % qs.length];
	const res = await fetch(`https://api.pexels.com/videos/search?${new URLSearchParams({ query, orientation: 'portrait', size: 'medium', per_page: '40' })}`, { headers: { Authorization: key } });
	if (!res.ok) { console.warn(`Pexels ${res.status} for "${query}"`); return null; }
	const { videos = [] } = await res.json();
	const ok = videos.filter((v) => v.duration >= 7 && v.height > v.width);
	if (!ok.length) return null;
	const v = ok[Math.floor(h / qs.length) % ok.length];
	const f = v.video_files.filter((x) => x.file_type === 'video/mp4' && x.height >= 1280 && x.height > x.width).sort((a, b) => a.height - b.height)[0] ?? v.video_files[0];
	const cache = join(dir, 'pexels');
	mkdirSync(cache, { recursive: true });
	const file = join(cache, `${v.id}.mp4`);
	if (!existsSync(file)) {
		const r = await fetch(f.link);
		if (!r.ok) return null;
		writeFileSync(file, Buffer.from(await r.arrayBuffer()));
	}
	return { file, credit: `🎥 ${v.user?.name ?? 'Pexels'} / Pexels` };
}

/** Several different clips for a fast-cut video (format K). Own clips in marketing/clips/<theme>/ first, then Pexels. */
export async function clipsFor(job, root, n = 5) {
	const out = [];
	const themeDir = join(root, 'marketing', 'clips', job.theme);
	if (existsSync(themeDir)) {
		const files = readdirSync(themeDir).filter((f) => f.endsWith('.mp4')).sort();
		const h = hash(job.date + job.slot);
		for (let i = 0; i < Math.min(n, files.length); i++) out.push({ file: join(themeDir, files[(h + i) % files.length]), credit: null });
		if (out.length >= n) return out;
	}
	const key = process.env.PEXELS_API_KEY;
	if (!key) return out;
	const qs = QUERIES[job.theme] ?? ['sunrise'];
	const cache = join(root, 'marketing', 'clips', 'pexels');
	mkdirSync(cache, { recursive: true });
	const seen = new Set();
	for (let i = 0; out.length < n && i < n * 3; i++) {
		const query = qs[(hash(job.date + job.slot) + i) % qs.length];
		const res = await fetch(`https://api.pexels.com/videos/search?${new URLSearchParams({ query, orientation: 'portrait', size: 'medium', per_page: '30' })}`, { headers: { Authorization: key } });
		if (!res.ok) break;
		const { videos = [] } = await res.json();
		const pool = videos.filter((v) => v.duration >= 4 && v.height > v.width && !seen.has(v.id));
		if (!pool.length) continue;
		const v = pool[(hash(job.date + job.slot + i) >>> 3) % pool.length];
		seen.add(v.id);
		const f = v.video_files.filter((x) => x.file_type === 'video/mp4' && x.height >= 1280 && x.height > x.width).sort((a, b) => a.height - b.height)[0] ?? v.video_files[0];
		const file = join(cache, `${v.id}.mp4`);
		if (!existsSync(file)) {
			const r = await fetch(f.link);
			if (!r.ok) continue;
			writeFileSync(file, Buffer.from(await r.arrayBuffer()));
		}
		out.push({ file, credit: v.user?.name ?? null });
	}
	return out;
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

/** n landscape clips (≥ 1280 wide) for these Pexels queries; cached in marketing/clips/pexels. */
export async function landscapeClips(queries, seed, root, n = 1) {
	const key = process.env.PEXELS_API_KEY;
	if (!key) return [];
	const cache = join(root, 'marketing', 'clips', 'pexels');
	mkdirSync(cache, { recursive: true });
	const out = [], seen = new Set();
	for (let i = 0; out.length < n && i < n * 3; i++) {
		const query = queries[(hash(seed) + i) % queries.length];
		const res = await fetch(`https://api.pexels.com/videos/search?${new URLSearchParams({ query, orientation: 'landscape', size: 'medium', per_page: '30' })}`, { headers: { Authorization: key } });
		if (!res.ok) break;
		const { videos = [] } = await res.json();
		const pool = videos.filter((v) => v.duration >= 5 && v.width > v.height && !seen.has(v.id));
		if (!pool.length) continue;
		const v = pool[(hash(seed + i) >>> 3) % pool.length];
		seen.add(v.id);
		const f = v.video_files.filter((x) => x.file_type === 'video/mp4' && x.width >= 1280 && x.width > x.height).sort((a, b) => a.width - b.width)[0] ?? v.video_files[0];
		const file = join(cache, `${v.id}_l.mp4`);
		if (!existsSync(file)) {
			const r = await fetch(f.link);
			if (!r.ok) continue;
			writeFileSync(file, Buffer.from(await r.arrayBuffer()));
		}
		out.push({ file, credit: v.user?.name ?? null });
	}
	return out;
}
