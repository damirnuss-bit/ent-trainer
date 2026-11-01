"""Сухие звуки для квиза (в духе промо-ролика: щелчки, тики, глухие удары, без колокольчиков и «вжухов»)."""
import numpy as np
from scipy.signal import butter, sosfilt, lfilter
SR = 48000
rng = np.random.default_rng(7)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def T(n): return np.arange(n) / SR
def reson(x, f, q=30):
    r = np.exp(-np.pi * f / q / SR); w = 2 * np.pi * f / SR
    return lfilter([1 - r], [1, -2 * r * np.cos(w), r * r], x)
def impulse(n, d): return rng.standard_normal(n) * np.exp(-T(n) / d)
def click(f=3100, q=25, g=1.0):
    n = int(SR * .05); return (reson(impulse(n, .0007), f, q) * 6 + hp(impulse(n, .0004), 4000) * .5) * g
def key():
    n = int(SR * .09)
    return (reson(impulse(n, .0006), rng.uniform(2200, 3600), 18) * 5 + reson(impulse(n, .002), rng.uniform(170, 260), 6) * 2.2) * .55
def thock(f=140, d=.004, g=1.0):
    n = int(SR * .25); return (reson(impulse(n, d), f, 5) * 2.4 + reson(impulse(n, .0008), 2400, 15) * 1.2) * g
def slam(g=1.0):
    n = int(SR * .9); t = T(n)
    x = lp(rng.standard_normal(n), 120, 4) * np.exp(-t * 6) * 6 + reson(impulse(n, .006), 62, 4) * 3.5 + hp(impulse(n, .002), 1500) * .9
    return np.tanh(x * 1.4 * g) * .85
def tick(strong=False):  # часовой тик
    n = int(SR * .04)
    x = reson(impulse(n, .0004), 3150 if strong else 4200, 40) * 4 + reson(impulse(n, .0003), 7000, 40) * 2
    return x * (.75 if strong else .4)
def paper(d=.16):  # зачёркивание маркером
    n = int(SR * d); t = np.linspace(0, 1, n)
    return bp(rng.standard_normal(n), 900, 3500) * (np.sin(np.pi * t) ** .8) * .45 + reson(impulse(n, .001), 1100, 8) * .6
def pop():  # правильный ответ: короткий деревянный «поп» + щелчок
    a = thock(230, .002, 1.0); b = click(2600, 20, .9)
    out = np.zeros(int(SR * .3)); out[:len(a)] += a; out[:len(b)] += b; return out

class Track:
    def __init__(self, dur):
        self.N = int(SR * dur); self.L = np.zeros(self.N); self.R = np.zeros(self.N)
    def put(self, x, t, g=1.0, pan=0.0):
        i = int(t * SR)
        if i < 0 or i >= self.N: return
        x = x[: self.N - i]
        self.L[i:i + len(x)] += x * g * np.sqrt((1 - pan) / 2); self.R[i:i + len(x)] += x * g * np.sqrt((1 + pan) / 2)
