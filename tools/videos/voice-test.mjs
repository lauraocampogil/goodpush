// Renders the same two scripts with different voice settings so you can pick by ear.
//   node tools/videos/voice-test.mjs   → marketing/robot/voz-*.mp4  (GitHub Actions task "voices")
import { mkdirSync } from 'node:fs';
import { openRenderer } from './renderer.mjs';
import { SCRIPTS, sentences } from './scripts.mjs';

const out = new URL('../../marketing/robot/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const VARIANTS = [
	...(process.env.ELEVENLABS_API_KEY ? [{ name: 'elevenlabs', env: { TTS_ENGINE: 'chatterbox' } }] : []),
	{ name: 'chatterbox-intensa', env: { TTS_ENGINE: 'chatterbox-only', CB_EXAGGERATION: '0.9' } },
	{ name: 'chatterbox-calida', env: { TTS_ENGINE: 'chatterbox-only', CB_EXAGGERATION: '0.6' } },
	{ name: 'kokoro-actual', env: { TTS_ENGINE: 'kokoro' } }
];
const r = await openRenderer();
for (const v of VARIANTS) {
	Object.assign(process.env, { CB_EXAGGERATION: '', ...v.env });
	for (const [i, lang] of [[0, 'es'], [2, 'en']]) {
		const file = `${out}voz-${lang}-${v.name}.mp4`;
		const t0 = Date.now();
		await r.voice({ seed: `voices-${i}` }, lang, file, sentences(SCRIPTS[i][lang]));
		console.log('ok', file, Math.round((Date.now() - t0) / 1000) + 's');
	}
}
await r.close();
