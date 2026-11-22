"""Original background score for GoodPush voice videos — generated, so no copyright and no downloads.
   python3 tools/videos/music.py <out.wav> <seconds> <seed>
Sad/nostalgic piano arpeggios over a minor progression, a low pad from the start, and strings that swell
towards the end so the last line lands with more force (the @processlaw feeling)."""
import sys, hashlib
import numpy as np, soundfile as sf
from scipy.signal import fftconvolve, butter, sosfilt

SR = 44100
# Minor-key progressions (semitones from the key root, chord = root/minor-or-major)
PROGS = [
    [(0, 'm'), (8, 'M'), (3, 'M'), (10, 'M')],   # i  VI III VII  — the classic "nostalgia" loop
    [(0, 'm'), (5, 'm'), (8, 'M'), (7, 'M')],    # i  iv VI  V
    [(8, 'M'), (10, 'M'), (0, 'm'), (0, 'm')],   # VI VII i  i   — rising, hopeful
    [(0, 'm'), (10, 'M'), (8, 'M'), (10, 'M')],  # i  VII VI VII
]
KEYS = [57, 52, 55, 50, 53]  # A, E, G, D, F (MIDI, root around A3)
f = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def piano(freq, dur, vel):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k in range(1, 9):
        fk = freq * k * (1 + 0.0004 * k * k)  # slight inharmonicity, like a real string
        out += np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.1 + 0.9 * k)) / k ** 1.4
    att = np.minimum(1, t / 0.006)
    return out * att * vel

def pad(freq, dur, amp):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for d in (-0.12, 0, 0.11):  # detuned voices
        ph = 2 * np.pi * freq * (1 + d / 100) * t
        out += np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.0).clip(0)
    return out * env * amp

def chord(root, q):
    third = 3 if q == 'm' else 4
    return [root, root + third, root + 7]

def drum(kind, vel=1.0):
    t = np.arange(int(0.35 * SR)) / SR
    if kind == 'kick':
        f = 110 * np.exp(-t * 18) + 45
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * vel
    if kind == 'clap':
        n = np.random.default_rng(3).standard_normal(len(t))
        return sosfilt(butter(2, [900, 4000], 'band', fs=SR, output='sos'), n) * np.exp(-t * 22) * 0.6 * vel
    n = np.random.default_rng(5).standard_normal(len(t))  # hat
    return sosfilt(butter(2, 7000, 'high', fs=SR, output='sos'), n) * np.exp(-t * 60) * 0.25 * vel

def happy(out, seconds, seed):
    """Upbeat, feel-good loop: major key, four-on-the-floor, claps, bouncy bass and bright plucks."""
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    rng = np.random.default_rng(h % 2**32)
    key = [60, 62, 65, 67, 57][h % 5]
    prog = [[(0, 'M'), (7, 'M'), (9, 'm'), (5, 'M')], [(0, 'M'), (5, 'M'), (7, 'M'), (5, 'M')], [(9, 'm'), (5, 'M'), (0, 'M'), (7, 'M')]][(h >> 8) % 3]
    bpm = 112 + (h >> 16) % 12
    beat = 60 / bpm
    n = int((seconds + 2) * SR)
    buf = {k: np.zeros(n) for k in ('drums', 'bass', 'pluck', 'pad')}
    def add(k, sig, at):
        i = int(at * SR)
        if i >= n: return
        j = min(n, i + len(sig)); buf[k][i:j] += sig[: j - i]
    b, t = 0, 0.0
    while t < seconds + 1:
        root, q = prog[b % 4]
        notes = chord(key + root, q)
        for k in range(4):
            bt = t + k * beat
            add('drums', drum('kick', 1.0), bt)
            if k % 2 == 1: add('drums', drum('clap'), bt)
            add('drums', drum('hat', 0.8), bt + beat / 2)
            # bouncy offbeat bass
            add('bass', piano(f(notes[0] - 24), beat * 0.45, 0.9), bt + beat / 2)
        # pluck pattern (16ths, syncopated)
        patt = [0, 2, 1, 2, 0, 2, 1, 0]
        for e, idx in enumerate(patt):
            if (h >> e) & 1 or e % 2 == 0:
                add('pluck', piano(f(notes[idx] + 12), 0.5, 0.35 * rng.uniform(0.8, 1.1)), t + e * beat / 2)
        for m in notes:
            add('pad', pad(f(m), beat * 4 + 0.5, 0.03), t)
        t += beat * 4; b += 1
    lp = lambda x, c: sosfilt(butter(2, c, 'low', fs=SR, output='sos'), x)
    mix = buf['drums'] * 0.55 + lp(buf['bass'], 300) * 0.9 + lp(buf['pluck'], 6000) * 0.8 + lp(buf['pad'], 2500)
    L = int(1.2 * SR); tt = np.arange(L) / SR
    ir = rng.standard_normal(L) * np.exp(-tt * 5); ir[0] = 0
    wet = fftconvolve(lp(buf['pluck'], 6000) + buf['pad'], ir)[:n]
    wet /= np.abs(wet).max() + 1e-9
    mix = mix / (np.abs(mix).max() + 1e-9) + wet * 0.18
    mix = mix[: int(seconds * SR)]
    tt = np.arange(len(mix)) / SR
    mix *= np.minimum(1, tt / 0.3) * np.minimum(1, (seconds - tt) / 1.2).clip(0)
    mix /= np.abs(mix).max() + 1e-9
    sf.write(out, np.stack([mix, mix], axis=1).astype(np.float32) * 0.85, SR)

def main():
    out, seconds, seed = sys.argv[1], float(sys.argv[2]), sys.argv[3]
    if len(sys.argv) > 4 and sys.argv[4] == 'happy':
        return happy(out, seconds, seed)
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    rng = np.random.default_rng(h % 2**32)
    key, prog = KEYS[h % len(KEYS)], PROGS[(h >> 8) % len(PROGS)]
    bpm = 64 + (h >> 16) % 10
    beat = 60 / bpm
    bar = beat * 4
    n = int((seconds + 4) * SR)
    pno, pd, strg, sub = (np.zeros(n) for _ in range(4))

    def add(buf, sig, at):
        i = int(at * SR)
        if i >= n: return
        j = min(n, i + len(sig))
        buf[i:j] += sig[: j - i]

    t, b = 0.0, 0
    while t < seconds + 2:
        root, q = prog[b % len(prog)]
        notes = chord(key + root, q)
        prog_t = min(1, t / max(1, seconds - 3))          # 0 → 1 over the video
        # Piano: broken chord in eighths (root, fifth, octave, third…), softer at the start
        patt = [notes[0] - 12, notes[2] - 12, notes[0], notes[1], notes[2], notes[1], notes[0], notes[2] - 12]
        for e, m in enumerate(patt):
            vel = (0.55 + 0.25 * prog_t) * (1.0 if e % 4 == 0 else 0.7) * rng.uniform(0.85, 1.05)
            add(pno, piano(f(m), 3.2, vel), t + e * beat / 2 + rng.uniform(0, 0.012))
        # A high melody note on the downbeat once the video has warmed up
        if prog_t > 0.35:
            add(pno, piano(f(notes[(b * 2) % 3] + 12), 3.5, 0.45), t)
        # Pad + sub-bass all the way, strings swell in the second half
        for m in notes:
            add(pd, pad(f(m - 12), bar + 1.0, 0.05), t)
        add(sub, pad(f(notes[0] - 24), bar + 0.8, 0.10 * (0.4 + 0.6 * prog_t)), t)
        if prog_t > 0.45:
            amp = 0.06 * (prog_t - 0.45) / 0.55
            for m in notes + [notes[0] + 12]:
                add(strg, pad(f(m), bar + 1.2, amp), t)
        t += bar
        b += 1

    lp = lambda x, c: sosfilt(butter(2, c, 'low', fs=SR, output='sos'), x)
    mix = lp(pno, 4200) * 0.9 + lp(pd, 1800) + lp(strg, 3000) + lp(sub, 220)
    # Big soft hall reverb (exp-decaying noise impulse), stereo
    L = int(3.2 * SR)
    tt = np.arange(L) / SR
    irL = rng.standard_normal(L) * np.exp(-tt * 2.2)
    irR = rng.standard_normal(L) * np.exp(-tt * 2.2)
    irL[0] = irR[0] = 0
    wetL, wetR = fftconvolve(mix, irL)[:n], fftconvolve(mix, irR)[:n]
    wetL, wetR = wetL / (np.abs(wetL).max() + 1e-9), wetR / (np.abs(wetR).max() + 1e-9)
    dry = mix / (np.abs(mix).max() + 1e-9)
    st = np.stack([dry * 0.65 + wetL * 0.55, dry * 0.65 + wetR * 0.55], axis=1)
    st = st[: int(seconds * SR)]
    tt = np.arange(len(st)) / SR
    st *= (np.minimum(1, tt / 1.5) * np.minimum(1, (seconds - tt) / 2.0).clip(0))[:, None]
    st /= np.abs(st).max() + 1e-9
    sf.write(out, (st * 0.8).astype(np.float32), SR)

if __name__ == '__main__':
    main()
