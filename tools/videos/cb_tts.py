"""Expressive voice-over with Chatterbox Multilingual (Resemble AI, MIT licence, open source, runs on CPU).
   python3 tools/videos/cb_tts.py <lang> <out.wav> "line 1" "line 2" ...   → prints JSON [{start, end}] per line
Same interface as tts.py (Kokoro), so the renderer can switch with TTS_ENGINE=chatterbox.

Voice: put a 10–20 s clean recording of the voice you want in tools/videos/voices/<lang>.wav
(only a voice you have permission to use — yours, or someone who agreed). Without it, the model's
built-in voice is used. cfg_weight 0 stops the reference's accent leaking into the other language,
so Spanish sounds Spanish and English sounds English.
Tuning (env): CB_EXAGGERATION (emotion, 0.25–2, default 0.75), CB_CFG (pace/accent, default 0.3; 0 for es),
CB_TEMPERATURE (default 0.8)."""
import json, os, sys
import numpy as np, soundfile as sf
import torch
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

HERE = os.path.dirname(os.path.abspath(__file__))
GAP = float(os.environ.get('TTS_GAP', '0.6'))

def main():
    lang, out, lines = sys.argv[1], sys.argv[2], sys.argv[3:]
    torch.set_num_threads(os.cpu_count() or 2)
    torch.manual_seed(int(os.environ.get('CB_SEED', '7')))
    model = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
    ref = os.environ.get('CB_VOICE_' + lang.upper()) or os.path.join(HERE, 'voices', f'{lang}.wav')
    ref = ref if os.path.exists(ref) else None
    exag = float(os.environ.get('CB_EXAGGERATION', '0.75'))
    # Without a native reference the built-in voice is English: cfg 0 keeps its accent out of other languages
    cfg = float(os.environ.get('CB_CFG', '0.3' if (lang == 'en' or ref) else '0'))
    temp = float(os.environ.get('CB_TEMPERATURE', '0.8'))
    sr = model.sr
    chunks, times, t = [np.zeros(int(0.35 * sr), dtype=np.float32)], [], 0.35
    for i, line in enumerate(lines):
        wav = model.generate(line.replace('*', ''), language_id=lang, audio_prompt_path=ref if i == 0 else None,
                             exaggeration=exag, cfg_weight=cfg, temperature=temp)
        s = wav.squeeze(0).numpy().astype(np.float32)
        # trim leading/trailing near-silence so the word timing stays tight
        idx = np.where(np.abs(s) > 0.01)[0]
        if len(idx): s = s[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.08 * sr)]
        chunks.append(s)
        times.append({'start': round(t, 3), 'end': round(t + len(s) / sr, 3)})
        t += len(s) / sr + GAP
        chunks.append(np.zeros(int(GAP * sr), dtype=np.float32))
    sf.write(out, np.concatenate(chunks), sr)
    print(json.dumps(times))

if __name__ == '__main__':
    main()
