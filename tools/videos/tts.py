"""Voice-over for format K with Kokoro (open source, Apache-2.0, runs offline on CPU).
   python3 tools/videos/tts.py <lang> <out.wav> "line 1" "line 2" ...   → prints JSON [{start, end}] per line
Models (downloaded once, ~120 MB) live in tools/videos/.tts/ — see download_models()."""
import json, os, sys, urllib.request
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.tts')
BASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
FILES = ['kokoro-v1.0.int8.onnx', 'voices-v1.0.bin']
VOICE = {'en': ('am_michael', 'en-us'), 'es': ('em_alex', 'es'), 'fr': ('ff_siwis', 'fr-fr')}
GAP = 0.28  # breath between lines

def download_models():
    os.makedirs(HERE, exist_ok=True)
    for f in FILES:
        p = os.path.join(HERE, f)
        if not os.path.exists(p):
            urllib.request.urlretrieve(BASE + f, p)
    return [os.path.join(HERE, f) for f in FILES]

def main():
    lang, out, lines = sys.argv[1], sys.argv[2], sys.argv[3:]
    k = Kokoro(*download_models())
    voice, code = VOICE.get(lang, VOICE['en'])
    chunks, times, t, sr = [], [], 0.35, 24000
    chunks.append(np.zeros(int(0.35 * sr), dtype=np.float32))
    for line in lines:
        s, sr = k.create(line.replace('*', ''), voice=voice, speed=1.05, lang=code)
        chunks.append(s.astype(np.float32))
        times.append({'start': round(t, 3), 'end': round(t + len(s) / sr, 3)})
        t += len(s) / sr + GAP
        chunks.append(np.zeros(int(GAP * sr), dtype=np.float32))
    sf.write(out, np.concatenate(chunks), sr)
    print(json.dumps(times))

if __name__ == '__main__':
    main()
