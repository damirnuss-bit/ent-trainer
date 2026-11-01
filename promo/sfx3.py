"""Sound design v3: dry title foley like the reference pack (clicks, keys, thocks, mechanical counter, low pass-by).
No pitch sweeps, no sine drones, no whistles. Timeline in v1 seconds, scaled by S."""
import numpy as np
from scipy.signal import butter, sosfilt, lfilter, fftconvolve
from scipy.io import wavfile

SR = 48000; S = 1.2
N = int(SR * 33.0 * S)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(5)

def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def T(n): return np.arange(n) / SR
def reson(x, f, q=30):
    """2-pole resonator: rings at f like a small hard object"""
    r = np.exp(-np.pi * f / q / SR); w = 2 * np.pi * f / SR
    return lfilter([1 - r], [1, -2 * r * np.cos(w), r * r], x)
def put(x, t, g=1.0, pan=0.0):
    i = int(t * S * SR)
    if i < 0 or i >= N: return
    x = x[: N - i]
    L[i:i + len(x)] += x * g * np.sqrt((1 - pan) / 2); R[i:i + len(x)] += x * g * np.sqrt((1 + pan) / 2)

def impulse(n, d):
    t = T(n); return rng.standard_normal(n) * np.exp(-t / d)

def click(f=3100, q=25, g=1.0):          # mouse / UI click
    n = int(SR * .05)
    x = reson(impulse(n, .0007), f, q) * 6 + hp(impulse(n, .0004), 4000) * .5
    return x * g
def key():                                # keyboard key: tick + plastic thock
    n = int(SR * .09)
    tick = reson(impulse(n, .0006), rng.uniform(2200, 3600), 18) * 5
    thock = reson(impulse(n, .002), rng.uniform(170, 260), 6) * 2.2
    return (tick + thock) * .55
def thock(f=140, d=.004, g=1.0):         # soft low "appear" knock
    n = int(SR * .25)
    return (reson(impulse(n, d), f, 5) * 2.4 + reson(impulse(n, .0008), 2400, 15) * 1.2) * g
def slam(g=1.0):                          # heavy title hit: low body + snap, short tail
    n = int(SR * .9); t = T(n)
    body = lp(rng.standard_normal(n), 120, 4) * np.exp(-t * 6) * 6
    knock = reson(impulse(n, .006), 62, 4) * 3.5
    snap = hp(impulse(n, .002), 1500) * .9
    x = np.tanh((body + knock + snap) * 1.4 * g)
    return x * .85
def counter_tick():                       # mechanical counter (ref: rings ~3.1k and ~7k)
    n = int(SR * .03)
    return (reson(impulse(n, .0004), 3150, 40) * 4 + reson(impulse(n, .0003), 7000, 40) * 2) * .6
def passby(d=.8, g=1.0):                  # low, dry pass-by of an object (no high whistle)
    n = int(SR * d); t = np.linspace(0, 1, n)
    x = lp(rng.standard_normal(n), 520, 4) * 3 + bp(rng.standard_normal(n), 500, 1400) * .25
    e = np.exp(-((t - .55) ** 2) / .05)
    return x * e * g * .7
def shutter():                            # camera-like double click for cuts
    a = click(2600, 20, .8); b = click(1800, 14, .6)
    out = np.zeros(int(SR * .08)); out[:len(a)] += a; o = int(SR * .028); out[o:o + len(b)] += b[: len(out) - o]
    return out
def paper(d=.12):                         # marker / tape strip for lime boxes
    n = int(SR * d); t = np.linspace(0, 1, n)
    x = bp(rng.standard_normal(n), 900, 3500) * (np.sin(np.pi * t) ** .8) * .35
    x += reson(impulse(n, .001), 1100, 8) * .6
    return x
def wrong():                              # dull double knock
    a = thock(110, .006, .9); out = np.zeros(int(SR * .35)); out[:len(a)] += a; o = int(SR * .09); out[o:o + len(a)] += a[: len(out) - o] * .8
    return out

# -------- events (v1 timeline) --------
CUTS = [2.2, 4.2, 6.8, 9.8, 13.4, 16.2, 19.0, 21.8, 23.8, 26.0, 28.6]
for c in CUTS: put(shutter(), c, .7, pan=rng.uniform(-.2, .2))

# typing for each word that pops (keys per word)
WORDS = [(0.05, 7), (0.95, 9), (4.25, 8), (4.65, 5), (7.5, 9), (9.85, 9), (11.25, 7), (13.45, 9), (16.25, 9),
         (19.4, 10), (21.85, 7), (23.85, 9), (28.7, 9), (30.1, 9), (30.25, 8)]
for t0, k in WORDS:
    for j in range(k): put(key(), t0 + j * .028 + rng.uniform(0, .008), .5, pan=rng.uniform(-.35, .35))
# lime highlight boxes
HLS = [1.25, 3.35, 4.85, 9.05, 11.6, 13.75, 16.55, 19.05, 22.55, 24.2, 28.9]
for h in HLS: put(paper(), h, .8, pan=rng.uniform(-.3, .3)); put(thock(160, .003, .6), h + .02, .7)

put(slam(1.0), .55, 1.0)                                  # 35 000
for k in range(18): put(counter_tick(), 2.3 + k * .032, .8, pan=rng.uniform(-.2, .2))
put(slam(.9), 2.85, .9)                                   # 0
put(passby(.7), 4.25, .8)                                 # phone comes in
put(thock(150, .004, 1), 6.95, .9); put(thock(130, .004, 1), 7.15, .9)   # chips
for k in range(32): put(counter_tick(), 7.6 + k * .034, .7, pan=rng.uniform(-.2, .2))
put(slam(.85), 8.7, .9)                                   # infinity
put(passby(.6), 9.8, .6)
put(click(3000, 25), 10.5, 1.0); put(thock(220, .002, .7), 10.55, .6)    # correct tap
put(click(3000, 25), 11.12, 1.0); put(wrong(), 11.16, .9)                # wrong tap
for z in [11.5, 13.85, 16.55]: put(passby(.8, .8), z, .6)                # zooms
put(click(3000, 25), 19.7, 1.0)
for k in range(14): put(counter_tick(), 20.1 + k * (1 / 7), .45)        # exam timer
put(passby(.6), 22.25, .7, pan=-.4)                                      # flip
put(click(2400, 18), 22.6, .8)
for k, c in enumerate([24.5, 24.59, 24.68, 24.77, 24.86, 24.95, 25.04, 25.13]): put(thock(rng.uniform(140, 200), .003, .7), c, .7, pan=(-.4 if k % 2 else .4))
put(thock(120, .005, 1), 25.55, 1.0)                                     # + new subject
for st in [26.0, 26.85, 27.7]: put(slam(.9), st, .9)
put(slam(1.0), 28.9, 1.0)
put(click(2800, 22), 29.5, .9); put(thock(180, .003, .6), 29.52, .6)    # button
put(passby(.7, .6), 32.4, .5)

# tiny room, mostly dry
irn = int(SR * .35); ir = rng.standard_normal(irn) * np.exp(-T(irn) * 18); ir = lp(ir, 6000); ir /= np.sqrt((ir ** 2).sum()) * 6
mix = np.stack([L + fftconvolve(L, ir)[:N] * .5, R + fftconvolve(R, ir[::-1])[:N] * .5], 1)
mix = hp(mix.T, 30).T
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fn = int(SR * .4); mix[-fn:] *= np.linspace(1, 0, fn)[:, None]
mix /= np.abs(mix).max() / 0.89
wavfile.write('sfx3.wav', SR, (mix * 32767).astype(np.int16))
print('ok')
