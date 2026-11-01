import subprocess, sys, time, os, re, json, datetime
from playwright.sync_api import sync_playwright
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'ent-trainer')
LANG = os.environ.get('LANG_', 'ru')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shots' + ('' if LANG == 'ru' else '_' + LANG))
os.makedirs(OUT, exist_ok=True)
PORT = 8791
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)

now = datetime.datetime.now()
def d(i): return (now - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
rec = ('1101101111' * 10)[:100]  # 70%
ps = [41, 46, 44, 52, 55, 53, 60, 63, 66, 64, 70, 74]
att = [{'t': int((now - datetime.timedelta(days=12 - i)).timestamp() * 1000), 'm': 'mini', 'k': 'mini', 'n': 20, 'c': round(p / 5), 'p': p, 'e': round(p * 1.4)} for i, p in enumerate(ps)]
state = {
  'ts': int(time.time() * 1000), 'set': {'lang': 'ru', 'track': 'mathphys', 'onboarded': True},
  'att': att,
  'tp': {'math': {'eq': [9, 10], 'prog': [8, 10], 'trig': [2, 6], 'logs': [3, 7], 'func': [7, 9]},
         'physics': {'mech': [8, 10], 'optics': [2, 5], 'elec': [6, 8]},
         'history': {'saki': [7, 8], 'khanate': [6, 8], 'colony': [5, 7]},
         'reading': {'text': [9, 10]}, 'mathlit': {'percent': [8, 9], 'speed': [6, 7]}},
  'rec': rec, 'day': {'d': d(0), 'n': 24}, 'streak': {'n': 6, 'last': d(0)},
  'best': {}, 'hist': {d(i): n for i, n in enumerate([24, 31, 18, 40, 22, 35, 28])},
}

with sync_playwright() as p:
    b = p.chromium.launch()
    def ctx_for(lang=LANG, st=state):
        s = json.loads(json.dumps(st)); s['set']['lang'] = lang
        c = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True, color_scheme='dark')
        c.route(re.compile(r'^https?://(?!127\.0\.0\.1).*'), lambda r: r.abort())
        c.add_init_script(f"localStorage.setItem('ent_state_v1', {json.dumps(json.dumps(s))}); localStorage.removeItem('ent_session_v1');")
        pg = c.new_page(); pg.on('dialog', lambda dl: dl.accept())
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_timeout(900)
        return c, pg
    def shot(pg, n, full=False):
        pg.wait_for_timeout(450); pg.screenshot(path=f'{OUT}/{n}.png', full_page=full)

    c, pg = ctx_for()
    shot(pg, 'home')
    pg.click('[data-tab=progress]'); shot(pg, 'progress')
    pg.click('[data-tab=practice]'); shot(pg, 'practice')
    pg.click('[data-tab=home]'); pg.wait_for_timeout(300)
    pg.click('[data-tab=practice]'); pg.wait_for_timeout(300); pg.click('[data-act=goTopics]'); pg.wait_for_timeout(300)
    pg.locator('[data-act=topicSubject]').filter(has_text='Математика').first.click(); pg.wait_for_timeout(300)
    shot(pg, 'topics')
    for k in range(6):
        pg.locator('[data-act=startTopic]').nth(k + 1).click(); pg.wait_for_selector('.qtext'); pg.wait_for_timeout(300)
        s2 = pg.evaluate("JSON.parse(localStorage.getItem('ent_session_v1')||'null')")
        if s2['q'][0]['type'] == 'single' and len(s2['q'][0]['ru']['text']) < 90: break
        pg.click('[data-tab=practice]') if pg.locator('[data-tab=practice]').is_visible() else pg.go_back()
        pg.goto(f'http://127.0.0.1:{PORT}/index.html'); pg.wait_for_timeout(700); pg.click('[data-tab=practice]'); pg.wait_for_timeout(300); pg.click('[data-act=goTopics]'); pg.wait_for_timeout(300)
        pg.locator('[data-act=topicSubject]').filter(has_text='Математика').first.click(); pg.wait_for_timeout(300)
    ses = pg.evaluate("JSON.parse(localStorage.getItem('ent_session_v1')||'null')")
    def cur_q():
        s2 = pg.evaluate("JSON.parse(localStorage.getItem('ent_session_v1')||'null')")
        import re as _r
        i = int(_r.search(r'(\d+)\s*/\s*\d+', pg.inner_text('#app')).group(1)) - 1
        return s2['q'][i]
    q = cur_q(); print(q['type'], q['answer'])
    shot(pg, 'q_before')
    pg.locator('.opt').nth(q['answer'][0]).click(); shot(pg, 'q_picked')
    pg.click('#mb'); pg.wait_for_timeout(400)
    q = cur_q(); print(q['type'], q['answer'])
    if q['type'] == 'single':
        wrong = [i for i in range(len(q['ru']['options'])) if i not in q['answer']][0]
        pg.locator('.opt').nth(wrong).click(); shot(pg, 'q_wrong')
    c.close()
    c, pg = ctx_for()
    pg.click('[data-tab=practice]'); pg.wait_for_timeout(300)
    if pg.locator('[data-act=goExams]').count(): pg.click('[data-act=goExams]'); shot(pg, 'exams')
    pg.locator('[data-act=startExam],[data-act=startVariant]').first.click(); pg.wait_for_selector('.qtext'); pg.wait_for_timeout(2500); shot(pg, 'exam_q')
    c.close()

    c, pg = ctx_for('kk'); shot(pg, 'home_kk'); c.close()
    c, pg = ctx_for('ru'); shot(pg, 'home_ru'); c.close()
    b.close()
srv.terminate()
