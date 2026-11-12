// Shared renderer: draws one post (video or carousel) from template.html. Used by the social robot.
// job = { date, slot, theme, format: A|B|D|R|E|F, hook: {lang}, phrases: [{lang}], streak }
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import { renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(join(here, 'template.html')).href;
const FPS = 30;

function encoder(file, { clip, duration } = {}) {
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
	const inputs = pngs.flatMap((p) => ['-loop', '1', '-t', '1.6', '-framerate', String(FPS), '-i', p]);
	const chains = pngs.map((_, k) => `[${k}:v]scale=1080:1920,setsar=1,format=yuv420p[s${k}]`).join(';');
	const filter = `${chains};${pngs.map((_, k) => `[s${k}]`).join('')}concat=n=${pngs.length}:v=1:a=0[v]`;
	const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-map', '[v]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', tmp], { stdio: 'inherit' });
	return new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(tmp, file), ok()) : ko(new Error('ffmpeg slides ' + c)))));
}


const run = (args) => new Promise((ok, ko) => { const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' }); p.on('exit', (c) => (c === 0 ? ok() : ko(new Error('ffmpeg ' + c)))); });

/** Background for K: one clip per spoken line, hard cuts on the line starts, slow push-in, slightly darker. */
async function cutsVideo(clips, times, D, file) {
	const starts = times.map((t, i) => (i === 0 ? 0 : t.start - 0.06));
	const segs = starts.map((a, i) => ({ a, d: (i + 1 < starts.length ? starts[i + 1] : D) - a }));
	const inputs = segs.flatMap((_, i) => ['-stream_loop', '-1', '-i', clips[i % clips.length]]);
	const chains = segs.map((sg, i) => `[${i}:v]trim=duration=${sg.d.toFixed(3)},setpts=PTS-STARTPTS,fps=${FPS},scale=w='trunc(1080*(1.10+0.08*t/${sg.d.toFixed(3)})/2)*2':h=-2:eval=frame,scale=1188:2112:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,eq=brightness=-0.06:saturation=0.92:contrast=1.05,format=yuv420p[c${i}]`).join(';');
	await run([...inputs, '-filter_complex', `${chains};${segs.map((_, i) => `[c${i}]`).join('')}concat=n=${segs.length}:v=1:a=0[v]`, '-map', '[v]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-t', D.toFixed(3), file]);
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

		/** Format K: fast cuts + voice-over + kinetic captions. job.script = { [lang]: ["line", …] } */
		async kinetic(job, lang, file, clips) {
			if (!clips.length) throw new Error('K needs at least one clip');
			const tmp = join(tmpdir(), `gpk_${process.pid}_${Date.now()}`);
			const wav = `${tmp}.wav`, bg = `${tmp}_bg.mp4`;
			const lines = job.script[lang];
			const times = JSON.parse(execFileSync('python3', [join(here, 'tts.py'), lang, wav, ...lines], { encoding: 'utf8' }).trim().split('\n').pop());
			await page.setViewportSize({ width: 1080, height: 1920 });
			await page.goto(url);
			const D = await page.evaluate((j) => window.setupK(j), { ...job, lang, lines: lines.map((text, i) => ({ text, ...times[i] })) });
			await cutsVideo(clips, times, D, bg);
			const part = file.replace(/\.mp4$/, '.part.mp4');
			const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', bg, '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', wav,
				'-filter_complex', '[0:v][1:v]overlay=format=auto:shortest=1,format=yuv420p[v]', '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-maxrate', '6M', '-bufsize', '12M',
				'-c:a', 'aac', '-b:a', '160k', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,apad', '-t', D.toFixed(3), '-r', String(FPS), '-movflags', '+faststart', part], { stdio: ['pipe', 'inherit', 'inherit'] });
			const done = new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(part, file), ok()) : ko(new Error('ffmpeg K ' + c)))));
			for (let k = 0; k < D * FPS; k++) {
				await page.evaluate((x) => window.draw(x), k / FPS);
				const buf = await page.screenshot({ type: 'png', omitBackground: true });
				if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r));
			}
			p.stdin.end();
			await done;
			rmSync(wav, { force: true }); rmSync(bg, { force: true });
			return file;
		},
		close: () => browser.close()
	};
}
