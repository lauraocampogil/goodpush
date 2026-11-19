// Voice-over with ElevenLabs (deep, cinematic narrator voices with a native accent per language).
//   node tools/videos/el_tts.mjs <lang> <out.wav> "line 1" "line 2" …  → prints JSON [{start, end}] per line
// Same interface as tts.py / cb_tts.py. Needs ELEVENLABS_API_KEY (GitHub secret) and a voice per language:
//   ELEVENLABS_VOICE_EN, ELEVENLABS_VOICE_ES  (voice IDs from the ElevenLabs Voice Library — licensed voices only)
// Lines are sent with the previous/next text so the intonation flows like one speech, not robot sentences.
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [lang, out, ...lines] = process.argv.slice(2);
const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env[`ELEVENLABS_VOICE_${lang.toUpperCase()}`];
if (!key || !voice) throw new Error(`ElevenLabs not configured for ${lang}`);
const GAP = Number(process.env.TTS_GAP || 0.6);
const SR = 44100;
const tmp = join(tmpdir(), `el_${process.pid}`);

const settings = {
	stability: Number(process.env.EL_STABILITY || 0.35), // lower = more emotion
	similarity_boost: 0.8,
	style: Number(process.env.EL_STYLE || 0.45), // higher = more dramatic delivery
	use_speaker_boost: true,
	speed: Number(process.env.EL_SPEED || 0.92)
};
const parts = [];
const times = [];
let t = 0.35;
for (let i = 0; i < lines.length; i++) {
	const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
		method: 'POST',
		headers: { 'xi-api-key': key, 'content-type': 'application/json' },
		body: JSON.stringify({
			text: lines[i].replace(/\*/g, ''),
			model_id: process.env.EL_MODEL || 'eleven_multilingual_v2',
			voice_settings: settings,
			previous_text: lines.slice(0, i).join(' ') || undefined,
			next_text: lines.slice(i + 1).join(' ') || undefined
		})
	});
	if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`);
	const mp3 = `${tmp}_${i}.mp3`;
	writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
	const raw = `${tmp}_${i}.f32`;
	// decode + trim silence at both ends
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp3, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ac', '1', '-ar', String(SR), '-f', 'f32le', raw]);
	const buf = execFileSync('cat', [raw], { maxBuffer: 256 << 20 });
	const dur = buf.length / 4 / SR;
	parts.push(buf);
	times.push({ start: +t.toFixed(3), end: +(t + dur).toFixed(3) });
	t += dur + GAP;
	rmSync(mp3); rmSync(raw);
}
const silence = (s) => Buffer.alloc(Math.round(s * SR) * 4);
const all = Buffer.concat([silence(0.35), ...parts.flatMap((p) => [p, silence(GAP)])]);
const rawAll = `${tmp}_all.f32`;
writeFileSync(rawAll, all);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', rawAll, out]);
rmSync(rawAll);
console.log(JSON.stringify(times));
