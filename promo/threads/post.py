#!/usr/bin/env python3
"""Публикует в Threads посты из queue.json, у которых подошло время (Threads API, без сторонних сервисов).
Секрет THREADS_TOKEN: долгоживущий токен Threads (60 дней). Запуск: python3 post.py [--refresh] [--dry]"""
import json, os, sys, time, urllib.parse, urllib.request, datetime as dt, pathlib, subprocess
HERE = pathlib.Path(__file__).parent
API = 'https://graph.threads.net/v1.0'
TOKEN = os.environ.get('THREADS_TOKEN', '')
DRY = '--dry' in sys.argv
LATE = dt.timedelta(hours=6)   # пропущенные дольше 6 часов не постим, чтобы не было пачки подряд
MAX_PER_RUN = 2

def call(url, data=None):
    req = urllib.request.Request(url, data=urllib.parse.urlencode(data).encode() if data else None)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def publish(text):
    c = call(f'{API}/me/threads', {'media_type': 'TEXT', 'text': text, 'access_token': TOKEN})
    time.sleep(5)
    p = call(f'{API}/me/threads_publish', {'creation_id': c['id'], 'access_token': TOKEN})
    return p['id']

def refresh():
    r = call('https://graph.threads.net/refresh_access_token?' + urllib.parse.urlencode(
        {'grant_type': 'th_refresh_token', 'access_token': TOKEN}))
    new = r['access_token']
    print('токен продлён на', r.get('expires_in', 0) // 86400, 'дней')
    if new != TOKEN and os.environ.get('GH_TOKEN'):
        subprocess.run(['gh', 'secret', 'set', 'THREADS_TOKEN', '--body', new], check=True)
        print('секрет THREADS_TOKEN обновлён')

def main():
    if not TOKEN:
        sys.exit('нет THREADS_TOKEN')
    if '--refresh' in sys.argv:
        return refresh()
    queue = json.load(open(HERE / 'queue.json', encoding='utf8'))
    pf = HERE / 'posted.json'
    posted = json.load(open(pf, encoding='utf8')) if pf.exists() else {}
    now = dt.datetime.now(dt.timezone.utc)
    done = 0
    for item in sorted(queue, key=lambda x: x['at']):
        key = item['at'] + ' ' + item['lang']
        at = dt.datetime.fromisoformat(item['at'])
        if key in posted or at > now:
            continue
        if now - at > LATE:
            posted[key] = 'skipped-late'; continue
        if done >= MAX_PER_RUN:
            break
        print('публикую', key, item['text'][:50].replace('\n', ' '))
        posted[key] = 'dry' if DRY else publish(item['text'])
        done += 1
    json.dump(posted, open(pf, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('опубликовано:', done)

main()
