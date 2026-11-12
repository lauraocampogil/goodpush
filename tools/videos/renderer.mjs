// Shared renderer: draws one post (video or carousel) from template.html. Used by the social robot.
// job = { date, slot, theme, format: A|B|D|R|E|F, hook: {lang}, phrases: [{lang}], streak }
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, 'template.html')).href;
const FPS = 30;

function encoder(file, { clip, duration } = {}) {
	const tmp = file.replace(/\.mp4$/, '.part.mp4');
	const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart'];
	const a = clip
		? ['-y', '-loglevel', 'error', '-stream_loop', '-1', '-i', clip, '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
			'-filter_complex', `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${FPS},setsar=1,trim=duration=${duration},setpts=PTS-STARTPTS[bg];[bg][1:v]overlay=format=auto:shortest=1,format=yuv420p[v]`,
			'-map', '[v]', '-an', '-t', String(duration), ...enc, tmp]
		: ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...enc, tmp];
	const p = spawn('ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] });
	const done = new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(tmp, file), ok()) : ko(new Error('ffmpeg ' + c)))));
	return { write: (buf) => new Promise((ok) => (p.stdin.write(buf) ? ok() : p.stdin.once('drain', ok))), close: () => (p.stdin.end(), done) };
}

function slidesVideo(pngs, file) {
	const tmp = file.replace(/\.mp4$/, '.part.mp4');
	const inputs = pngs.flatMap((p) => ['-loop', '1', '-t', '1.6', '-framerate', String(FPS), '-i', p]);
	const chains = pngs.map((_, k) => `[${k}:v]scale=1080:1920,setsar=1,format=yuv420p[s${k}]`).join(';');
	const filter = `${chains};${pngs.map((_, k) => `[s${k}]`).join('')}concat=n=${pngs.length}:v=1:a=0[v]`;
	const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', tmp], { stdio: 'inherit' });
	return new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(tmp, file), ok()) : ko(new Error('ffmpeg slides ' + c)))));
}

export async function openRenderer() {
	const browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
	return {
		/** One MP4 (formats A B D F, or R with a background clip). */
		async video(job, lang, file, clip = null) {
			await page.setViewportSize({ width: 1080, height: 1920 });
			await page.goto(url);
			const dur = await page.evaluate((j) => window.setup(j), { ...job, lang });
			const enc = encoder(file, clip ? { clip, duration: dur } : {});
			for (let k = 0; k < dur * FPS; k++) {
				await page.evaluate((x) => window.draw(x), k / FPS);
				await enc.write(await page.screenshot(clip ? { type: 'png', omitBackground: true } : { type: 'jpeg', quality: 92 }));
			}
			await enc.close();
			return file;
		},
		/** Format E: 6 PNG slides (1080×1350, Instagram) + the same slides as a 9:16 MP4 (TikTok). */
		async carousel(job, lang, dir, base) {
			const pngs = [];
			const tall = [];
			for (const [h, list, name] of [[1350, pngs, (i) => `${base}_${i + 1}.png`], [1920, tall, (i) => `.${base}_tall_${i + 1}.png`]]) {
				await page.setViewportSize({ width: 1080, height: h });
				for (let i = 0; i < 6; i++) {
					await page.goto(url);
					await page.evaluate(([j, k, hh]) => window.slide(j, k, hh), [{ ...job, lang }, i, h]);
					const f = join(dir, name(i));
					await page.screenshot({ path: f, clip: { x: 0, y: 0, width: 1080, height: h } });
					list.push(f);
				}
			}
			const video = join(dir, `${base}.mp4`);
			await slidesVideo(tall, video);
			tall.forEach((f) => rmSync(f, { force: true }));
			await page.setViewportSize({ width: 1080, height: 1920 });
			return { pngs, video };
		},
		close: () => browser.close()
	};
}
