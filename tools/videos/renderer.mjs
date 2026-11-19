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

function encoder(file, { clip, duration, band = null } = {}) {
	const tmp = file.replace(/\.mp4$/, '.part.mp4');
	const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-maxrate', '6M', '-bufsize', '12M', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart'];
	const a = clip
		? ['-y', '-loglevel', 'error', '-stream_loop', '-1', '-i', clip, '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
			'-filter_complex', `[0:v]${band ? `fps=${FPS},${BAND_F(band.w, band.h, band.y, band.x)}` : `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${FPS},setsar=1`},trim=duration=${duration},setpts=PTS-STARTPTS${band ? '' : ',eq=contrast=1.06:saturation=0.82:brightness=-0.02,colorbalance=rs=0.04:gs=0.0:bs=-0.04:rh=-0.03:bh=0.05'}[bg];[bg][1:v]overlay=format=auto:shortest=1${band ? '' : ',noise=alls=6:allf=t'},format=yuv420p[v]`,
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

/** Landscape footage → a 1080×608 band centred in the 9:16 frame (formats Q and S). */
const BAND_F = (W = 1080, H = 608, Y = 656, X = 0) => `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,pad=1080:1920:${X}:${Y}:black`;

/** Background for K: one clip per spoken line, hard cuts on the line starts, slow push-in, slightly darker. */
async function cutsVideo(clips, times, D, file, band = false, bandY = 656) {
	const starts = times.map((t, i) => (i === 0 ? 0 : t.start - 0.06));
	const segs = starts.map((a, i) => ({ a, d: (i + 1 < starts.length ? starts[i + 1] : D) - a }));
	const inputs = segs.flatMap((_, i) => ['-stream_loop', '-1', '-i', clips[i % clips.length]]);
	const chains = segs.map((sg, i) => `[${i}:v]trim=duration=${sg.d.toFixed(3)},setpts=PTS-STARTPTS,fps=${FPS},${band ? `scale=w='trunc(1080*(1.0+0.06*t/${sg.d.toFixed(3)})/2)*2':h=-2:eval=frame,${BAND_F(1080, 608, bandY)},eq=contrast=1.04` : `scale=w='trunc(1080*(1.10+0.08*t/${sg.d.toFixed(3)})/2)*2':h=-2:eval=frame,scale=1188:2112:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,eq=brightness=-0.06:saturation=0.92:contrast=1.05`},format=yuv420p[c${i}]`).join(';');
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
		/** Format Q: real quote, narrator voice, letterboxed footage cuts. job.quote = { text, who, src } (text for this language) */
		async quote(job, lang, file, clips) {
			if (!clips.length) throw new Error('Q needs at least one clip');
			await page.setViewportSize({ width: 1080, height: 1920 });
			await page.goto(url);
			const D = await page.evaluate((j) => window.setupQ(j), { ...job, lang });
			const tmp = join(tmpdir(), `gpq_${process.pid}_${Date.now()}.mp4`);
			// a cut every ~3 s, footage in the band (y 560)
			const n = Math.max(1, Math.round(D / 3));
			await cutsVideo(clips, Array.from({ length: n }, (_, i) => ({ start: (i * D) / n })), D, tmp, true, 560);
			const part = file.replace(/\.mp4$/, '.part.mp4');
			const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
				'-filter_complex', '[0:v][1:v]overlay=format=auto:shortest=1,format=yuv420p[v]', '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-maxrate', '6M', '-bufsize', '12M',
				'-t', D.toFixed(3), '-r', String(FPS), '-movflags', '+faststart', part], { stdio: ['pipe', 'inherit', 'inherit'] });
			const done = new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(part, file), ok()) : ko(new Error('ffmpeg Q ' + c)))));
			for (let k = 0; k < D * FPS; k++) {
				await page.evaluate((x) => window.draw(x), k / FPS);
				const buf = await page.screenshot({ type: 'png', omitBackground: true });
				if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r));
			}
			p.stdin.end();
			await done;
			rmSync(tmp, { force: true });
			return file;
		},
		/** Format S: satisfying clip in a rounded window + the quote on top. Silent: the trending sound is added in the app. */
		async satisfy(job, lang, file, clip) {
			await page.setViewportSize({ width: 1080, height: 1920 });
			await page.goto(url);
			const dur = await page.evaluate((j) => window.setupS(j), { ...job, lang });
			const enc = encoder(file, { clip, duration: dur });
			for (let k = 0; k < dur * FPS; k++) {
				await page.evaluate((x) => window.draw(x), k / FPS);
				await enc.write(await page.screenshot({ type: 'png', omitBackground: true }));
			}
			await enc.close();
			return file;
		},
		/** Format K, silent processlaw style: portrait footage cuts (~2.5 s) + the message 1–3 words at a time. */
		async pulse(job, lang, file, clips = []) {
			if (!clips.length) { // no footage → plain black, like @processlaw
				const black = join(tmpdir(), `gp_black_${process.pid}.mp4`);
				await run(['-f', 'lavfi', '-i', `color=c=0x0B0B0B:s=1080x1920:r=${FPS}`, '-t', '4', '-pix_fmt', 'yuv420p', black]);
				clips = [black];
				job = { ...job, solid: true }; // branded animated background instead
			}
			await page.setViewportSize({ width: 1080, height: 1920 });
			await page.goto(url);
			const D = await page.evaluate((j) => window.setupP(j), { ...job, lang });
			const tmp = join(tmpdir(), `gpp_${process.pid}_${Date.now()}.mp4`);
			const n = Math.max(1, Math.round(D / 2.6));
			await cutsVideo(clips, Array.from({ length: n }, (_, i) => ({ start: (i * D) / n })), D, tmp);
			const part = file.replace(/\.mp4$/, '.part.mp4');
			const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
				'-filter_complex', '[0:v][1:v]overlay=format=auto:shortest=1,format=yuv420p[v]', '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-maxrate', '6M', '-bufsize', '12M',
				'-t', D.toFixed(3), '-r', String(FPS), '-movflags', '+faststart', part], { stdio: ['pipe', 'inherit', 'inherit'] });
			const done = new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(part, file), ok()) : ko(new Error('ffmpeg K ' + c)))));
			for (let k = 0; k < D * FPS; k++) {
				await page.evaluate((x) => window.draw(x), k / FPS);
				const buf = await page.screenshot({ type: 'png', omitBackground: true });
				if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r));
			}
			p.stdin.end();
			await done;
			rmSync(tmp, { force: true });
			return file;
		},
		/** Format M: pastel card with the smiley mascot (no footage). */
		async mascotCard(job, lang, file) {
			await page.setViewportSize({ width: 1080, height: 1920 });
			await page.goto(url);
			const dur = await page.evaluate((j) => window.setupM(j), { ...job, lang });
			const enc = encoder(file);
			for (let k = 0; k < dur * FPS; k++) {
				await page.evaluate((x) => window.draw(x), k / FPS);
				await enc.write(await page.screenshot({ type: 'jpeg', quality: 92 }));
			}
			await enc.close();
			return file;
		},
		/** GoodPush voice video (K, S, Q): brand colours + logo + AI voice, words in sync. lines = sentences. */
		async voice(job, lang, file, lines) {
			const tmp = join(tmpdir(), `gpv_${process.pid}_${Date.now()}`);
			const wav = `${tmp}.wav`;
			const speakable = lines.map((l) => l.replace(/\*/g, ''));
			// Voice: Chatterbox (expressive, native accent per language) when installed, else Kokoro
			const env = { ...process.env, TTS_SPEED: process.env.TTS_SPEED || '0.92', TTS_GAP: process.env.TTS_GAP || '0.6' };
			const speak = (py, script) => JSON.parse(execFileSync(py, [join(here, script), lang, wav, ...speakable], { encoding: 'utf8', env, maxBuffer: 64 << 20 }).trim().split('\n').pop());
			let times;
			if (process.env.ELEVENLABS_API_KEY && process.env[`ELEVENLABS_VOICE_${lang.toUpperCase()}`] && process.env.TTS_ENGINE !== 'kokoro' && process.env.TTS_ENGINE !== 'chatterbox-only') {
				try { times = speak('node', 'el_tts.mjs'); } catch (e) { console.warn('[voice] elevenlabs failed, trying next engine', e.message); }
			}
			if (!times && (process.env.TTS_ENGINE || '').startsWith('chatterbox')) {
				try { times = speak(process.env.CB_PYTHON || 'python3', 'cb_tts.py'); } catch (e) { console.warn('[voice] chatterbox failed, using kokoro', e.message); }
			}
			times ??= speak('python3', 'tts.py');
			await page.setViewportSize({ width: 1080, height: 1920 });
			await page.goto(url);
			const D = await page.evaluate((j) => window.setupV(j), { ...job, lang, lines: speakable.map((text, i) => ({ text, ...times[i] })) });
			// Original score (music.py): sad piano + strings that swell, ducked under the voice
			const mus = `${tmp}_m.wav`;
			let music = true;
			try { execFileSync('python3', [join(here, 'music.py'), mus, D.toFixed(2), String(job.seed ?? file)]); } catch (e) { music = false; console.warn('[voice] music skipped', e.message); }
			const audio = music
				? ['-filter_complex', `[1:a]aformat=channel_layouts=stereo,aresample=44100,apad,asplit=2[vo][sc];[2:a]volume=0.32[bg];[bg][sc]sidechaincompress=threshold=0.04:ratio=5:attack=40:release=450[duck];[vo][duck]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]`, '-map', '0:v', '-map', '[a]']
				: ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11,apad', '-map', '0:v', '-map', '1:a'];
			const part = file.replace(/\.mp4$/, '.part.mp4');
			const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav, ...(music ? ['-i', mus] : []),
				...audio, '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
				'-c:a', 'aac', '-b:a', '160k', '-t', D.toFixed(3), '-movflags', '+faststart', part], { stdio: ['pipe', 'inherit', 'inherit'] });
			const done = new Promise((ok, ko) => p.on('exit', (c) => (c === 0 ? (renameSync(part, file), ok()) : ko(new Error('ffmpeg voice ' + c)))));
			for (let k = 0; k < D * FPS; k++) {
				await page.evaluate((x) => window.draw(x), k / FPS);
				const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
				if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r));
			}
			p.stdin.end();
			await done;
			rmSync(wav, { force: true });
			rmSync(mus, { force: true });
			return file;
		},
		close: () => browser.close()
	};
}
