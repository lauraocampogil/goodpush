// Hero loops for the website (the TikTok wall): node tools/videos/hero.mjs [fallbackClipsDir]
// Uses real footage (marketing/clips/<theme>/ or Pexels with PEXELS_API_KEY); otherwise the clips in fallbackClipsDir.
// Output: static/hero/<lang>-<n>.mp4 (540×960, muted, small) + .jpg posters.
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { openRenderer } from './renderer.mjs';
import { clipsFor } from './clips.mjs';
import { planRange } from './plan.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = join(root, 'static', 'hero');
mkdirSync(out, { recursive: true });
const fallback = process.argv[2] ? readdirSync(process.argv[2]).filter((f) => f.endsWith('.mp4')).map((f) => join(process.argv[2], f)) : [];
const rows = planRange('2026-11-16', 7, { auto: true });
const pick = (f) => rows.find(f);
const tiles = [
	pick((r) => r.format === 'K' && r.theme === 'discipline'),
	pick((r) => r.format === 'A'),
	pick((r) => r.format === 'K' && r.theme === 'sport'),
	pick((r) => r.format === 'F') ?? { ...rows[0], format: 'F', streak: 12 }
];
const r = await openRenderer();
for (const lang of ['en', 'es', 'fr']) {
	for (const [n, job] of tiles.entries()) {
		const tmp = join(tmpdir(), `hero_${lang}_${n}.mp4`);
		if (job.format === 'K') {
			const real = await clipsFor(job, root, job.script[lang].length).catch(() => []);
			const clips = real.length ? real.map((c) => c.file) : fallback.slice(n).concat(fallback.slice(0, n));
			await r.kinetic(job, lang, tmp, clips);
		} else {
			await r.video({ ...job, streak: job.streak || 12 }, lang, tmp);
		}
		const dst = join(out, `${lang}-${n + 1}.mp4`);
		execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp, '-an', '-vf', 'scale=540:960:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dst]);
		execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '2.5', '-i', dst, '-frames:v', '1', '-q:v', '5', dst.replace(/\.mp4$/, '.jpg')]);
		rmSync(tmp, { force: true });
		console.log('✓', dst);
	}
}
await r.close();
