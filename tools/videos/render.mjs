// GoodPush video factory — turns the content plan into ready-to-post files.
//   node tools/videos/render.mjs                    → this week (Mon–Sun containing today)
//   node tools/videos/render.mjs 2026-11-02         → the week starting that day
//   node tools/videos/render.mjs 2026-11-02 1       → one day only
//   node tools/videos/render.mjs next --auto        → next week, robot mode (what GitHub Actions runs every Saturday)
//   node tools/videos/render.mjs --preview          → one still per format, to check the design
// --auto: no screen recordings (C → R) and real footage (R) on some evenings — see plan.mjs + clips.mjs.
// Output: marketing/videos/<week>/<date>_<slot>_<format>_<lang>.mp4 (+ carousel PNGs, captions_<start>.md, manifest.json)
// Needs: ffmpeg + playwright (npm i --no-save playwright && npx playwright install chromium). No sound on purpose:
// add a trending sound inside TikTok / Instagram (licensed there, and it boosts reach).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, renameSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { planRange } from './plan.mjs';
import { clipFor } from './clips.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
// Social accounts that exist (the website keeps every language). Add fr here when @goodpush.fr opens.
const LANGS = (process.env.SOCIAL_LANGS ?? 'en,es').split(',').map((l) => l.trim()).filter(Boolean);
const FPS = 30;
const args = process.argv.slice(2);
const preview = args.includes('--preview');
const auto = args.includes('--auto');
const pos = args.filter((a) => !a.startsWith('--'));

const monday = (d) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const today = new Date().toISOString().slice(0, 10);
const start = pos[0] === 'next' ? addDays(monday(today), 7) : pos[0] && /^\d{4}-\d{2}-\d{2}$/.test(pos[0]) ? pos[0] : monday(today);
const days = Number(pos[1] ?? 7);
const jobs = planRange(start, days, { auto: auto || preview });
const outDir = join(root, 'marketing', 'videos', monday(start));
mkdirSync(outDir, { recursive: true });

function ffmpeg(file, { clip, duration } = {}) {
	const tmp = file.replace(/\.mp4$/, '.part.mp4');
	const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart'];
	const a = clip
		? ['-y', '-loglevel', 'error', '-stream_loop', '-1', '-i', clip, '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
			'-filter_complex', `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${FPS},setsar=1,trim=duration=${duration},setpts=PTS-STARTPTS,eq=contrast=1.06:saturation=0.82:brightness=-0.02,colorbalance=rs=0.04:gs=0.0:bs=-0.04:rh=-0.03:bh=0.05[bg];[bg][1:v]overlay=format=auto:shortest=1,noise=alls=6:allf=t,format=yuv420p[v]`,
			'-map', '[v]', '-an', '-t', String(duration), ...enc, tmp]
		: ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...enc, tmp];
	const p = spawn('ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] });
	const done = new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(tmp, file), ok()) : ko(new Error('ffmpeg ' + c)))));
	return { write: (buf) => new Promise((ok) => (p.stdin.write(buf) ? ok() : p.stdin.once('drain', ok))), close: () => (p.stdin.end(), done) };
}

function slidesVideo(pngs, file) {
	const tmp = file.replace(/\.mp4$/, '.part.mp4');
	const SLIDE = 1.6;
	const inputs = pngs.flatMap((p) => ['-loop', '1', '-t', String(SLIDE), '-framerate', String(FPS), '-i', p]);
	const chains = pngs.map((_, k) => `[${k}:v]scale=1080:1920,setsar=1,format=yuv420p[s${k}]`).join(';');
	const filter = `${chains};${pngs.map((_, k) => `[s${k}]`).join('')}concat=n=${pngs.length}:v=1:a=0[v]`;
	const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', tmp], { stdio: 'inherit' });
	return new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(tmp, file), ok()) : ko(new Error('ffmpeg slides ' + c)))));
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const url = pathToFileURL(join(here, 'template.html')).href;
const captions = [`# GoodPush — ${start} (+${days} days)\n`];
const manifestFile = join(outDir, 'manifest.json');
const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')).filter((p) => p.date < start || p.date >= addDays(start, days)) : [];
let made = 0;

const list = preview ? ['A', 'B', 'D', 'R', 'F', 'E'].map((f) => jobs.find((j) => j.format === f)).filter(Boolean) : jobs;
for (const job0 of list) {
	let job = job0;
	let clip = null;
	if (job.format === 'R') {
		clip = await clipFor(job, root).catch((e) => (console.warn('clip:', e.message), null));
		if (!clip) job = { ...job, format: 'D' }; // no footage → branded version
	}
	for (const lang of preview ? ['es'] : LANGS) {
		const base = `${job.date}_${job.slot.toLowerCase()}_${job.format}_${lang}`;
		const files = [];
		if (job.format === 'C') { // screen recording of the real app — filmed by hand
			captions.push(`## ${job.date} · ${job.slot} · ${lang.toUpperCase()} · C (record your phone screen)\n`);
			continue;
		} else if (job.format === 'E') {
			for (let i = 0; i < 6; i++) {
				await page.setViewportSize({ width: 1080, height: 1350 });
				await page.goto(url);
				await page.evaluate(([j, k]) => window.slide(j, k), [{ ...job, lang }, i]);
				const f = `${base}_${i + 1}.png`;
				await page.screenshot({ path: join(outDir, f), clip: { x: 0, y: 0, width: 1080, height: 1350 } });
				files.push(f);
				if (preview) break;
			}
			await page.setViewportSize({ width: 1080, height: 1920 });
			// TikTok gets the carousel as a short video: the same slides drawn 9:16, 1.6 s each
			if (!preview) {
				const vid = `${base}.mp4`;
				const file = join(outDir, vid);
				if (!existsSync(file)) {
					const tall = [];
					for (let i = 0; i < 6; i++) {
						await page.goto(url);
						await page.evaluate(([j, k]) => window.slide(j, k, 1920), [{ ...job, lang }, i]);
						const f = join(outDir, `.${base}_tall_${i + 1}.png`);
						await page.screenshot({ path: f });
						tall.push(f);
					}
					await slidesVideo(tall, file);
					tall.forEach((f) => rmSync(f, { force: true }));
				}
				job.video = { ...(job.video ?? {}), [lang]: vid };
			}
		} else if (preview) {
			await page.goto(url);
			const dur = await page.evaluate((j) => window.setup(j), { ...job, lang });
			for (const t of [1.4, dur - 0.8]) {
				await page.evaluate((x) => window.draw(x), t);
				await page.screenshot({ path: join(outDir, `preview_${job.format}_${t.toFixed(1)}.${clip ? 'png' : 'jpg'}`), ...(clip ? { omitBackground: true } : { type: 'jpeg', quality: 85 }) });
			}
		} else {
			const f = `${base}.mp4`;
			const file = join(outDir, f);
			if (!existsSync(file)) {
				await page.goto(url);
				const dur = await page.evaluate((j) => window.setup(j), { ...job, lang });
				const enc = ffmpeg(file, clip ? { clip: clip.file, duration: dur } : {});
				for (let k = 0; k < dur * FPS; k++) {
					await page.evaluate((x) => window.draw(x), k / FPS);
					await enc.write(await page.screenshot(clip ? { type: 'png', omitBackground: true } : { type: 'jpeg', quality: 92 }));
				}
				await enc.close();
			}
			files.push(f);
			made++;
		}
		if (!preview) {
			const caption = [job.caption[lang], clip?.credit, job.hashtags[lang]].filter(Boolean).join('\n\n');
			captions.push(`## ${job.date} · ${job.slot} · ${lang.toUpperCase()} · ${base}\n\n${caption}\n`);
			manifest.push({ date: job.date, slot: job.slot, format: job.format, lang, kind: job.format === 'E' ? 'carousel' : 'video', files, video: job.video?.[lang], caption, publish_at: job.publish[lang] });
		}
		process.stdout.write(`✓ ${base}${clip ? ' (' + basename(clip.file) + ')' : ''}\n`);
	}
}
if (!preview) {
	writeFileSync(join(outDir, `captions_${start}.md`), captions.join('\n'));
	manifest.sort((a, b) => a.publish_at.localeCompare(b.publish_at));
	writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
}
await browser.close();
console.log(preview ? `Previews in ${outDir}` : `Done: ${made} videos + carousels → ${outDir}`);
