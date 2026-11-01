"""Сборка ролика «Готов к ЕНТ? 5 вопросов».

python3 build.py 0 ru --voice voice/ep1_ru.mp3   # озвучка одним файлом (ElevenLabs/vidIQ, паузы 2.5 с между фразами)
python3 build.py 0 kk --eleven                    # ElevenLabs по фразам (ключ в ELEVENLABS_API_KEY), самый живой голос
python3 build.py 0 kk --edge kk-KZ-DauletNeural  # голос Microsoft Edge по фразам, без ключа и лимитов (pip install edge-tts)
python3 build.py 0 ru --script                   # только напечатать текст для озвучки
Результат: out/ep01_ru.mp4 и out/ep01_ru.txt (подпись к посту)
"""
import json, subprocess, sys, os, shutil
import numpy as np
from scipy.io import wavfile
from pathlib import Path
import sfx as S
from script import segments, tts_text, needs_review

HERE = Path(__file__).resolve().parent
SR = S.SR
TDUR, LDUR = 3.0, 1.25
TEMPO = 1.1  # ускорение голоса без смены тембра
TEMPO_END = 1.3  # финал (ответ на 1-й вопрос и призыв) быстрее
SUBJ = {'ru': 0, 'kk': 1}


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def voiced(x, thr=0.012, win=0.02):
    w = int(SR * win); n = len(x) // w
    rms = np.sqrt((x[:n * w].reshape(n, w) ** 2).mean(1))
    return rms > thr, w


def split_long_pauses(x, min_gap=1.5):
    v, w = voiced(x); segs = []; start = None; last = None
    for i, on in enumerate(v):
        if on:
            if start is None: start = i
            elif (i - last) * w / SR >= min_gap: segs.append((start, last + 1)); start = i
            last = i
    if start is not None: segs.append((start, last + 1))
    return [x[max(0, a * w - int(.03 * SR)): b * w + int(.06 * SR)] for a, b in segs]


def align(x, texts):
    """Режет одну дорожку озвучки на фразы без меток времени: ищет такие паузы-границы,
    чтобы длительность каждой фразы была пропорциональна числу букв в ней (динамическое программирование)."""
    v, w = voiced(x); n = len(v); gaps = []; i = 0
    while i < n:
        if not v[i]:
            j = i
            while j < n and not v[j]: j += 1
            if i > 0 and j < n and (j - i) * w / SR >= .18: gaps.append(((i + j) // 2, (j - i) * w / SR))
            i = j
        else: i += 1
    on = np.where(v)[0]; s0, s1 = on[0], on[-1] + 1
    L = [len(t) for t in texts]; K = len(texts)
    sec = (s1 - s0) * w / SR; c = sec / sum(L)
    pos = [s0] + [g[0] for g in gaps] + [s1]; glen = [0] + [g[1] for g in gaps] + [0]
    M = len(pos); INF = 1e18
    # dp[k][j]: фраза k заканчивается на границе j
    dp = [[INF] * M for _ in range(K + 1)]; bk = [[-1] * M for _ in range(K + 1)]; dp[0][0] = 0
    for k in range(1, K + 1):
        for j in range(1, M):
            if k == K and j != M - 1: continue
            for i in range(j):
                if dp[k - 1][i] >= INF: continue
                d = (pos[j] - pos[i]) * w / SR
                cost = dp[k - 1][i] + ((d - c * L[k - 1]) / (c * L[k - 1] + .5)) ** 2 - (.15 * glen[j] if j < M - 1 else 0)
                if cost < dp[k][j]: dp[k][j] = cost; bk[k][j] = i
    cuts = [M - 1]
    for k in range(K, 0, -1): cuts.append(bk[k][cuts[-1]])
    cuts = cuts[::-1]
    return [x[pos[cuts[k]] * w: pos[cuts[k + 1]] * w] for k in range(K)]


def tighten(x, maxgap=.22):
    """укорачивает паузы внутри фразы до maxgap: голос бодрее"""
    v, w = voiced(x); keep = np.ones(len(v), bool); run = 0
    for i, on in enumerate(v):
        run = 0 if on else run + 1
        if run * w / SR > maxgap: keep[i] = False
    out = np.concatenate([x[i * w:(i + 1) * w] for i in range(len(v)) if keep[i]] + [x[len(v) * w:]])
    return out


ELEVEN_VOICE = os.environ.get('ELEVEN_VOICE', 'TX3LPaxmHKxFdv7VOQHJ')  # Liam, как в пилоте


def eleven_segments(texts, tmp, lang):
    """ElevenLabs API напрямую, по одной фразе: синхрон точный. Нужен ключ ELEVENLABS_API_KEY.
    Готовые фразы кэшируются в voice_cache/, повторяющиеся (интро, уровни, призыв) не тратят символы."""
    import urllib.request, hashlib
    key = os.environ['ELEVENLABS_API_KEY']; cache = HERE / 'voice_cache'; cache.mkdir(exist_ok=True); out = []
    for t in texts:
        f = cache / (hashlib.sha1(f'{ELEVEN_VOICE}|{lang}|{t}'.encode()).hexdigest()[:16] + '.mp3')
        if not f.exists():
            body = json.dumps({'text': t, 'model_id': os.environ.get('ELEVEN_MODEL_' + lang.upper(), {'ru': 'eleven_multilingual_v2', 'kk': 'eleven_v3'}[lang]),
                               'voice_settings': {'stability': .45, 'similarity_boost': .8, 'style': .35}}).encode()
            req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{ELEVEN_VOICE}', body,
                                         {'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
            f.write_bytes(urllib.request.urlopen(req, timeout=120).read())
        out.append(decode(f))
    return out


def edge_segments(texts, voice, tmp):
    out = []
    for i, t in enumerate(texts):
        f = tmp / f'seg{i}.mp3'
        for attempt in range(4):  # сервис Microsoft иногда обрывается (NoAudioReceived): повторяем
            if subprocess.run(['edge-tts', '--voice', voice, '--text', t, '--write-media', str(f)]).returncode == 0 and f.stat().st_size: break
        else: sys.exit('edge-tts не ответил 4 раза подряд, запусти ещё раз')
        out.append(decode(f))
    return out


def speed(x, tempo=TEMPO):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f64le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={tempo}', '-f', 'f64le', '-'],
                         input=x.astype(np.float64).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float64)


def trim(x):
    v, w = voiced(x); idx = np.where(v)[0]
    return x[max(0, idx[0] * w - int(.03 * SR)): (idx[-1] + 1) * w + int(.06 * SR)] if len(idx) else x


def main():
    ei, lang = int(sys.argv[1]), sys.argv[2]
    eps = json.load(open(HERE / 'episodes.json', encoding='utf-8'))
    ep = eps[ei]; texts = segments(ep, lang)
    if '--script' in sys.argv:
        for q in ep:
            if needs_review(q, lang): print('!! проверь произношение, добавь в say.json:', q['id'], q[lang]['text'])
        print(tts_text(ep, lang)); return
    name = f'ep{ei + 1:02d}_{lang}'; tmp = HERE / 'build' / name
    shutil.rmtree(tmp, ignore_errors=True); tmp.mkdir(parents=True)
    if '--voice' in sys.argv:
        x = decode(sys.argv[sys.argv.index('--voice') + 1])
        if '--cuts' in sys.argv:  # границы фраз вручную, в секундах через запятую
            c = [0] + [int(float(v) * SR) for v in sys.argv[sys.argv.index('--cuts') + 1].split(',')] + [len(x)]
            segs = [x[c[i]:c[i + 1]] for i in range(len(c) - 1)]
        else:
            segs = align(x, texts)
    elif '--segdir' in sys.argv:  # готовые фразы seg0.mp3..seg11.mp3 (например, озвучены на другом компьютере)
        d = Path(sys.argv[sys.argv.index('--segdir') + 1]); segs = [decode(d / f'seg{i}.mp3') for i in range(len(texts))]
    elif '--eleven' in sys.argv:
        segs = eleven_segments(texts, tmp, lang)
    else:
        segs = edge_segments(texts, sys.argv[sys.argv.index('--edge') + 1], tmp)
    for o in [a for i, a in enumerate(sys.argv) if i and sys.argv[i - 1] == '--seg']:  # --seg 11=cta.mp3 заменить одну фразу
        k, f = o.split('=', 1); segs[int(k)] = decode(f)
    if len(segs) != len(texts):
        sys.exit(f'в озвучке {len(segs)} фраз, а нужно {len(texts)}: проверь паузы')
    segs = [speed(tighten(trim(s), .22 if i < 10 else .12), TEMPO if i < 10 else TEMPO_END) for i, s in enumerate(segs)]
    if '--check' in sys.argv:
        for i, (t, s) in enumerate(zip(texts, segs)): print(i, f'{len(s)/SR:5.2f}s', t[:70])
        return
    D = [len(s) / SR for s in segs]

    # ---- таймлайн ----
    V = []  # (время, индекс сегмента)
    tl = {'tdur': TDUR, 'ldur': LDUR, 'q': [], 'lad': []}
    V.append((.1, 0)); tl['intro'] = .1 + D[0] + .3          # титр «ответишь на 5 вопросов, значит готов»
    show = tl['intro']; V.append((show + .1, 1)); t0 = show + .1 + D[1] + .15
    tl['q'].append({'show': show, 't0': t0, 'reveal': None}); end = t0 + TDUR + .35
    for k in range(1, 5):
        qs, an = 2 * k, 2 * k + 1
        lt = end + .1; tl['lad'].append({'t': lt, 'lv': k})
        vs = lt + .15; V.append((vs, qs)); show = lt + LDUR - .15
        t0 = max(vs + D[qs], show + .6) + .15; rv = t0 + TDUR
        tl['q'].append({'show': show, 't0': t0, 'reveal': rv})
        V.append((rv + .15, an)); end = rv + .15 + D[an] + .3
        if k == 1:
            a = texts[an]; tl['heart'] = rv + .15 + D[an] * (len(a) - len(a.split('! ')[-1] if '!' in a else a.split('. ')[-1])) / len(a)
    fs = end + .05; V.append((fs + .15, 10))
    tl['final'] = {'show': fs, 't0': None, 'reveal': fs + .15 + D[10] * .45}
    tl['cta'] = fs + .15 + D[10] + .1; V.append((tl['cta'] + .05, 11))
    total = tl['cta'] + .05 + D[11] + .8

    # ---- звук ----
    tr = S.Track(total)
    for t, i in V: tr.put(segs[i], t, 1.0)
    for qi, q in enumerate(tl['q']):
        tr.put(S.thock(150, .004, .8), q['show'] + .02, .5)
        for j in range(4): tr.put(S.key(), q['show'] + .12 + j * .07, .35, pan=(-.3 if j % 2 else .3))
        for k in range(int(TDUR * 2)):
            tr.put(S.tick(k % 2 == 0), q['t0'] + k * .5, .5)
        if q['reveal']: tr.put(S.pop(), q['reveal'], .8)
    for l in tl['lad']:
        tr.put(S.thock(120, .005, 1), l['t'], .6); tr.put(S.paper(), l['t'] + .15, .7); tr.put(S.thock(170, .003, .8), l['t'] + .45, .6)
    for k in range(2): tr.put(S.click(2800, 22), tl['heart'] + k * .3, .6); tr.put(S.thock(200, .003, .6), tl['heart'] + k * .3, .5)
    tr.put(S.pop(), tl['final']['reveal'], .8)
    tr.put(S.slam(.9), tl['cta'], .55)
    mix = np.stack([tr.L, tr.R], 1)
    mix /= max(1e-9, np.abs(mix).max()) / .9
    wavfile.write(tmp / 'audio.wav', SR, (mix * 32767).astype(np.int16))

    # ---- кадры ----
    epv = [dict(q[lang], subject=q['subject'][SUBJ[lang]], correct=q['correct']) for q in ep]
    job = {'ep': epv, 'tl': tl, 'lang': lang, 'frames': str(tmp / 'frames')}
    json.dump(job, open(tmp / 'job.json', 'w'), ensure_ascii=False)
    nf = int(total * 30); W = int(os.environ.get('WORKERS', 4)); step = (nf + W - 1) // W
    ps = [subprocess.Popen(['node', str(HERE / 'render_ep.js'), str(tmp / 'job.json'), str(a), str(min(nf, a + step))]) for a in range(0, nf, step)]
    for p in ps:
        if p.wait(): sys.exit('рендер упал')
    out = HERE / 'out'; out.mkdir(exist_ok=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', str(tmp / 'frames/f%04d.jpg'), '-i', str(tmp / 'audio.wav'),
                    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest',
                    '-movflags', '+faststart', str(out / f'{name}.mp4')], check=True)
    cap = {'ru': 'Готов к ЕНТ? 5 вопросов от лёгкого до невозможного. Пиши в комменты, сколько набрал 👇\nДальше тренируйся в Telegram: @enttrainer_bot (ссылка в профиле), платить ничего не надо\n#ент #ент2027 #подготовкакент #тест #казахстан',
           'kk': 'ҰБТ-ға дайынсың ба? Оңайдан мүмкін еместке дейін 5 сұрақ. Нәтижеңді комментарийге жаз 👇\nАры қарай Telegram-да жаттық: @enttrainer_bot (сілтеме профильде), ештеңе төлеудің қажеті жоқ\n#ұбт #ұбт2027 #ұбтдайындық #тест #қазақстан'}[lang]
    (out / f'{name}.txt').write_text(cap + '\n\nОтветы/жауаптар: ' + ', '.join(q[lang]['options'][q['correct']] for q in ep) + '\n', encoding='utf-8')
    shutil.rmtree(tmp / 'frames')
    print(out / f'{name}.mp4', f'{total:.1f} c')


main()
