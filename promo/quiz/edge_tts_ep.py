import json, subprocess, sys, os
src, out = sys.argv[1], sys.argv[2]
V = {'ru': 'ru-RU-DmitryNeural', 'kk': 'kk-KZ-DauletNeural'}
for lang, texts in json.load(open(src, encoding='utf-8')).items():
    d = os.path.join(out, lang); os.makedirs(d, exist_ok=True)
    for i, t in enumerate(texts):
        f = os.path.join(d, f'seg{i}.mp3')
        for attempt in range(5):  # сервис иногда обрывается (NoAudioReceived)
            if subprocess.run([sys.executable, '-m', 'edge_tts', '--voice', V[lang], '--text', t, '--write-media', f]).returncode == 0 and os.path.getsize(f): break
        else: sys.exit(f'не получилось: {lang} seg{i}')
print('ok')
