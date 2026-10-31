"""Проверка работы внутри Telegram на имитации WebApp SDK:
нативные MainButton/BackButton, вибрация, CloudStorage, восстановление прогресса на "новом телефоне".
Запуск: python3 tests/ui-telegram-mock.py
"""
import subprocess, sys, time, os, re, json
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PORT = 8766
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.0)

MOCK = r"""
(() => {
  const cloud = JSON.parse(sessionStorage.getItem('__cloud') || '{}');
  const calls = JSON.parse(sessionStorage.getItem('__calls') || '[]');
  const log = (...a) => { calls.push(a); sessionStorage.setItem('__calls', JSON.stringify(calls.slice(-400))); };
  let mbFn = null, bbFn = null;
  window.__tg = { get mbFn() { return mbFn; }, get bbFn() { return bbFn; } };
  window.Telegram = { WebApp: {
    initData: 'query_id=test', initDataUnsafe: { user: { id: 777, language_code: 'kk' } },
    version: '8.0', platform: 'android', colorScheme: 'light', themeParams: {},
    isVersionAtLeast: () => true,
    ready: () => log('ready'), expand: () => log('expand'), disableVerticalSwipes: () => log('noswipe'),
    setHeaderColor: () => {}, onEvent: () => {}, offEvent: () => {},
    HapticFeedback: { notificationOccurred: (t) => log('haptic', t), impactOccurred: (t) => log('impact', t), selectionChanged: () => log('select') },
    MainButton: { text: '', isVisible: false,
      setText(t) { this.text = t; log('mb.text', t); }, show() { this.isVisible = true; log('mb.show'); }, hide() { this.isVisible = false; log('mb.hide'); },
      onClick(f) { mbFn = f; }, offClick(f) { if (mbFn === f) mbFn = null; }, enable() {}, disable() { log('mb.disable'); } },
    BackButton: { isVisible: false, show() { this.isVisible = true; log('bb.show'); }, hide() { this.isVisible = false; log('bb.hide'); },
      onClick(f) { bbFn = f; }, offClick(f) { if (bbFn === f) bbFn = null; } },
    CloudStorage: {
      getItems(keys, cb) { const o = {}; keys.forEach((k) => { o[k] = cloud[k] || ''; }); setTimeout(() => cb(null, o), 5); },
      setItem(k, v, cb) { if (v.length > 4096) { log('cloud.TOO_BIG', k, v.length); cb('too big'); return; } cloud[k] = v; sessionStorage.setItem('__cloud', JSON.stringify(cloud)); log('cloud.set', k, v.length); setTimeout(() => cb(null, true), 5); },
    },
    showConfirm: (m, cb) => { log('confirm', m); cb(true); }, showAlert: (m, cb) => cb && cb(),
    openTelegramLink: (u) => log('openTg', u), openLink: (u) => log('openLink', u),
  } };
})();
"""

errors, fails = [], []
def fail(m): fails.append(m); print('FAIL', m)

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    ctx.route(re.compile(r'^https?://(?!127\.0\.0\.1).*'), lambda r: r.abort())
    ctx.add_init_script(MOCK)
    page = ctx.new_page()
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: errors.append('console.error: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)

    def calls(): return page.evaluate("JSON.parse(sessionStorage.getItem('__calls')||'[]')")
    def press_main(): page.evaluate("window.__tg.mbFn && window.__tg.mbFn()"); page.wait_for_timeout(120)
    def press_back(): page.evaluate("window.__tg.bbFn && window.__tg.bbFn()"); page.wait_for_timeout(120)

    page.goto(f'http://127.0.0.1:{PORT}/index.html')
    page.wait_for_selector('[data-act=setLang]')
    if page.locator('#mb').is_visible(): fail('в Telegram виден запасной DOM-MainButton')
    page.click('[data-act=setLang][data-v=kk]')
    page.click('[data-act=setTrack][data-v=chembio]')
    page.wait_for_selector('.qtext')

    # биология тема "Жасуша" содержит multiple; химия первый вопрос
    page.locator('.opt').first.click()
    page.wait_for_selector('.fb')
    c = calls()
    if not any(x[0] == 'haptic' and x[1] in ('success', 'error') for x in c): fail('нет вибрации на ответ')
    mbtexts = [x[1] for x in c if x[0] == 'mb.text']
    print('тексты MainButton:', mbtexts[-3:])
    if 'Келесі' not in mbtexts: fail('MainButton не показал казахское «Келесі»')
    if not any(x[0] == 'bb.show' for x in c): fail('BackButton не показан')

    # пройти 10 вопросов нативной кнопкой
    for i in range(9):
        press_main()
        page.wait_for_selector('.opt, .mrow')
        if page.locator('.mrow').count():
            for r in range(page.locator('.mrow').count()): page.locator('.mrow').nth(r).locator('button').nth(0).click()
            press_main()
        elif page.locator('.opt.multi').count():
            page.locator('.opt.multi').nth(0).click(); page.locator('.opt.multi').nth(1).click()
            press_main()
        else:
            page.locator('.opt').first.click()
        page.wait_for_selector('.fb')
    press_main()
    page.wait_for_selector('.score')

    c = calls()
    sets = [x for x in c if x[0] == 'cloud.set']
    keys = sorted({x[1] for x in sets})
    print('ключи CloudStorage:', keys, ' макс.длина:', max(x[2] for x in sets))
    if any(x[0] == 'cloud.TOO_BIG' for x in c): fail('значение в CloudStorage больше 4096 символов')
    for k in ('set', 'att', 'rec'):
        if k not in keys: fail(f'в CloudStorage не записан ключ {k}')

    # "новый телефон": локальные данные стёрты, облако осталось
    page.wait_for_timeout(2200)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_selector('[data-act=startMini], [data-act=setLang]')
    if page.locator('[data-act=setLang]').count():
        fail('после очистки локальных данных настройки не восстановились из CloudStorage')
    else:
        txt = page.inner_text('#app')
        print('главный экран после восстановления:', txt.replace('\n', ' | ')[:120])
        if 'ҰБТ' not in txt and 'Мини' not in txt: fail('восстановлен не казахский язык')
        page.click('[data-act=goProgress]')
        page.wait_for_selector('.hist, .empty')
        if page.locator('.hist').count() == 0: fail('история попыток не восстановилась из облака')

    b.close()
srv.terminate()
print('\nОшибки консоли и страницы:', len(errors))
for e in errors[:10]: print('  ', e)
print('Провалов проверок:', len(fails))
sys.exit(1 if (errors or fails) else 0)
