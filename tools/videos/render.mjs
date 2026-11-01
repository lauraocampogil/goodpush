// GoodPush video factory — turns the content calendar (plan.json) into ready-to-post files.
//   node tools/videos/render.mjs                 → this week (Mon–Sun containing today)
//   node tools/videos/render.mjs 2026-11-02      → the week starting that day
//   node tools/videos/render.mjs 2026-11-02 1    → one day only
//   node tools/videos/render.mjs --preview       → one still per format, to check the design
// Output: marketing/videos/<week>/<date>_<slot>_<format>_<lang>.mp4 (+ carousel PNGs + captions.md)
// Needs: ffmpeg + playwright (npx playwright install chromium if missing). No sound on purpose:
// add a trending sound inside TikTok / Instagram (licensed there, and it boosts reach).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright'); // npm i -D playwright (once)
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const plan = JSON.parse(readFileSync(join(here, 'plan.json'), 'utf8'));
const LANGS = ['en', 'es', 'fr'];
const FPS = 30;
const args = process.argv.slice(2);
const preview = args.includes('--preview');

const monday = (d) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
const addDays = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const start = args[0] && /^\d{4}-\d{2}-\d{2}$/.test(args[0]) ? args[0] : monday(new Date().toISOString().slice(0, 10));
const days = Number(args[1] ?? 7);
const end = addDays(start, days);
// Streak series (format F): one number per Sunday, counting up from the first Sunday of the plan
const firstF = plan.find((r) => r.format === 'F')?.date;
const jobs = plan.filter((r) => r.date >= start && r.date < end).map((r) => ({ ...r, streak: r.format === 'F' ? 7 * (Math.round((Date.parse(r.date) - Date.parse(firstF)) / 6048e5) + 1) : 0 }));
const outDir = join(root, 'marketing', 'videos', monday(start));
mkdirSync(outDir, { recursive: true });

function ffmpeg(file) {
	const tmp = file.replace(/\.mp4$/, '.part.mp4');
	const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
		'-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
	const done = new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(tmp, file), ok()) : ko(new Error('ffmpeg ' + c)))));
	return { write: (buf) => new Promise((ok) => (p.stdin.write(buf) ? ok() : p.stdin.once('drain', ok))), close: () => (p.stdin.end(), done) };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const url = pathToFileURL(join(here, 'template.html')).href;
const captions = [`# GoodPush — week of ${start}\n`];
let made = 0;

const formats = preview ? ['A', 'B', 'D', 'F', 'E'].map((f) => jobs.find((j) => j.format === f) ?? plan.find((j) => j.format === f)) : jobs;
for (const job of formats) {
	if (!job) continue;
	for (const lang of preview ? ['es'] : LANGS) {
		const base = `${job.date}_${job.slot.toLowerCase()}_${job.format}_${lang}`;
		if (job.format === 'C') { // screen recording of the real app — filmed by hand
			captions.push(`## ${job.date} · ${job.slot} · ${lang.toUpperCase()} · C (record your phone screen)\n`);
		} else if (job.format === 'E') {
			for (let i = 0; i < 6; i++) {
				await page.setViewportSize({ width: 1080, height: 1350 });
				await page.goto(url);
				await page.evaluate(([j, k]) => window.slide(j, k), [{ ...job, lang }, i]);
				await page.screenshot({ path: join(outDir, `${base}_${i + 1}.png`), clip: { x: 0, y: 0, width: 1080, height: 1350 } });
				if (preview) break;
			}
			await page.setViewportSize({ width: 1080, height: 1920 });
		} else if (preview) {
			await page.goto(url);
			const dur = await page.evaluate((j) => window.setup(j), { ...job, lang });
			for (const t of [1.4, dur - 0.8]) {
				await page.evaluate((x) => window.draw(x), t);
				await page.screenshot({ path: join(outDir, `preview_${job.format}_${t.toFixed(1)}.jpg`), type: 'jpeg', quality: 85 });
			}
		} else {
			const file = join(outDir, `${base}.mp4`);
			if (!existsSync(file)) {
				await page.goto(url);
				const dur = await page.evaluate((j) => window.setup(j), { ...job, lang });
				const enc = ffmpeg(file);
				for (let f = 0; f < dur * FPS; f++) {
					await page.evaluate((x) => window.draw(x), f / FPS);
					await enc.write(await page.screenshot({ type: 'jpeg', quality: 92 }));
				}
				await enc.close();
			}
			made++;
		}
		if (!preview && job.format !== 'C') {
			captions.push(`## ${job.date} · ${job.slot} (${job.times[lang]}) · ${lang.toUpperCase()} · ${base}\n\n${job.caption[lang]}\n\n${job.hashtags[lang]}\n`);
		}
		process.stdout.write(`✓ ${base}\n`);
	}
}
if (!preview) writeFileSync(join(outDir, `captions_${start}.md`), captions.join('\n'));
await browser.close();
console.log(preview ? `Previews in ${outDir}` : `Done: ${made} videos + carousels → ${outDir}`);
