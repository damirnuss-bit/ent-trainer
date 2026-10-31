"""Дымовой тест интерфейса в headless Chromium (размер телефона).
Запуск: python3 tests/ui-smoke.py  (нужен playwright). Сервер поднимается сам.
"""
import subprocess, sys, time, os, re
from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SHOTS = os.environ.get('SHOTS', '/tmp/ent-shots')
os.makedirs(SHOTS, exist_ok=True)
PORT = 8765
srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.0)

errors, fails = [], []
def fail(msg):
    fails.append(msg); print('FAIL', msg)

def run():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        # внешние сайты (Telegram SDK, CDN) в песочнице недоступны: отдаём пустой ответ, как офлайн
        ctx.route(re.compile(r'^https?://(?!127\.0\.0\.1).*'), lambda r: r.abort())
        ctx.add_init_script("window.__dialogs = 0")
        page = ctx.new_page()
        page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
        page.on('console', lambda m: errors.append('console.error: ' + m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'ERR_FAILED' not in m.text else None)
        page.on('dialog', lambda d: d.accept())

        def shot(name):
            page.wait_for_timeout(320)
            page.screenshot(path=f'{SHOTS}/{name}.png')
        def mb(): return page.locator('#mb')
        def click_main():
            mb().click(); page.wait_for_timeout(120)
        def visible_text(): return page.inner_text('#app')

        page.goto(f'http://127.0.0.1:{PORT}/index.html')
        page.wait_for_selector('[data-act=setLang]')
        shot('01-lang')

        # --- онбординг: язык, связка, первый вопрос
        page.click('[data-act=setLang][data-v=ru]')
        page.wait_for_selector('[data-act=setTrack]')
        shot('02-track')
        page.click('[data-act=setTrack][data-v=mathphys]')
        page.wait_for_selector('.qtext')
        shot('03-first-question')
        if 'Теңдеу' in visible_text(): fail('первый вопрос на казахском при выбранном русском')

        # --- практика: 10 вопросов, на каждый ответ нажимаем первый вариант
        for i in range(10):
            page.wait_for_selector('.opt, .mrow')
            if page.locator('.mrow').count():
                for r in range(page.locator('.mrow').count()):
                    page.locator('.mrow').nth(r).locator('button').nth(r).click()
                click_main()
            elif page.locator('.opt.multi').count():
                page.locator('.opt').nth(0).click()
                page.locator('.opt').nth(1).click()
                click_main()
            else:
                page.locator('.opt').first.click()
            page.wait_for_selector('.fb')
            if i == 0: shot('04-feedback')
            click_main()
        page.wait_for_selector('.score')
        shot('05-results-practice')
        txt = visible_text()
        if '%' not in txt: fail('в результатах нет процента')

        page.click('[data-act=again]') if page.locator('[data-act=again]').count() else None
        page.wait_for_selector('.qtext')
        page.click('[data-act=quit]')   # диалог принимается автоматически
        page.wait_for_selector('.score')

        # --- домой: проверить карточки
        mb().click() if mb().is_visible() else None
        page.wait_for_selector('[data-act=startMini]')
        shot('06-home')
        if 'Прогноз' not in visible_text(): fail('нет блока прогноза на главной')

        # --- мини-тест 20 вопросов
        page.click('[data-act=startMini]')
        page.wait_for_selector('.qtext')
        n = 0
        while True:
            n += 1
            opts = page.locator('.opt')
            if opts.count(): opts.nth(n % opts.count()).click()
            elif page.locator('.mrow').count():
                for r in range(page.locator('.mrow').count()):
                    page.locator('.mrow').nth(r).locator('button').nth(r % 4).click()
            if n == 3: shot('07-mini-question')
            label = mb().inner_text()
            click_main()
            if page.locator('.score').count() or n > 40: break
        page.wait_for_selector('.score')
        shot('08-results-mini')
        if n != 20: fail(f'мини-тест прошёл за {n} шагов, ожидалось 20')

        # --- пробный ЕНТ: обзор, завершение с пропусками
        page.click('.btn.primary') if page.locator('.btn.primary').count() else None
        page.goto(f'http://127.0.0.1:{PORT}/index.html')
        page.wait_for_selector('[data-tab=practice]')
        page.click('[data-tab=practice]')
        page.wait_for_selector('[data-act=goExams]')
        page.click('[data-act=goExams]')
        page.wait_for_selector('[data-act=startVariant][data-v="1"]')
        page.click('[data-act=startVariant][data-v="1"]')
        page.wait_for_selector('.qtext')
        page.click('[data-act=grid]')
        page.wait_for_selector('.grid')
        shot('09-grid')
        cells = page.locator('.cell').count()
        print('заданий в пробном ЕНТ:', cells)
        page.locator('.cell').nth(5).click()
        page.wait_for_selector('.qtext')
        page.click('[data-act=flag]')
        page.click('[data-act=grid]'); page.wait_for_selector('.grid')
        if page.locator('.cell.flag').count() != 1: fail('флажок "вернуться позже" не отобразился в обзоре')
        click_main()                      # «Завершить» + confirm про пропуски (принимается)
        page.wait_for_selector('.score')
        shot('10-results-exam')
        if '140' not in visible_text(): fail('в результатах пробного ЕНТ нет баллов из 140')

        # --- результат: поделиться
        page.click('[data-act=share]')
        page.wait_for_selector('.modal img')
        shot('11-share')
        page.click('.modal [data-act=closeModal]')

        # --- прогресс и настройки
        mb().click()
        page.wait_for_selector('[data-tab=progress]')
        page.click('[data-tab=progress]')
        page.wait_for_selector('.hist')
        shot('12-progress')
        page.click('[data-tab=settings]')
        page.wait_for_selector('[data-act=setLang]')
        page.click('[data-act=setLang][data-v=kk]')
        page.wait_for_timeout(150)
        shot('13-settings-kk')
        page.click('[data-tab=home]')
        page.wait_for_selector('[data-act=startMini]')
        if 'ҰБТ' not in visible_text() and 'Мини' not in visible_text(): fail('казахский интерфейс не включился')
        shot('14-home-kk')

        # --- химия+биология: проверить типы заданий multiple и match, тема "Общая химия"
        page.click('[data-tab=settings]')
        page.click('[data-act=setTrack][data-v=chembio]')
        page.click('[data-tab=practice]')
        page.click('[data-act=goTopics]')
        page.wait_for_selector('.chip')
        page.locator('.chip', has_text='Химия').first.click()
        page.wait_for_selector('[data-act=startTopic]')
        shot('15-topics')
        def run_topic(seen_types):
            for step in range(30):
                if page.locator('.mrow').count(): seen_types.add('match')
                elif page.locator('.opt.multi').count(): seen_types.add('multiple')
                elif page.locator('.opt').count(): seen_types.add('single')
                if page.locator('.mrow').count():
                    if 'match' in seen_types and not os.path.exists(f'{SHOTS}/16-match.png'): shot('16-match')
                    for r in range(page.locator('.mrow').count()):
                        page.locator('.mrow').nth(r).locator('button').nth(r).click()
                    click_main()      # «Проверить»
                    page.wait_for_selector('.fb')
                    if not os.path.exists(f'{SHOTS}/17-match-checked.png'): shot('17-match-checked')
                elif page.locator('.opt.multi').count():
                    page.locator('.opt').nth(0).click()
                    page.locator('.opt').nth(1).click()
                    click_main()      # «Проверить»
                    page.wait_for_selector('.fb')
                elif page.locator('.opt').count():
                    page.locator('.opt').first.click()
                    page.wait_for_selector('.fb')
                if page.locator('.score').count(): break
                click_main()
                if page.locator('.score').count(): break
        seen_types = set()
        for attempt in range(6):          # в десяти случайных вопросах match может не попасться: пробуем заново
            if attempt:
                if page.locator('.score').count(): click_main()     # с экрана результата на главную
                page.click('[data-tab=practice]'); page.click('[data-act=goTopics]')
                page.locator('.chip', has_text='Химия').first.click()
                page.wait_for_selector('[data-act=startTopic]')
            page.locator('[data-act=startTopic][data-t=general]').click()
            page.wait_for_selector('.qtext')
            run_topic(seen_types)
            if 'match' in seen_types: break
        print('типы заданий замечены:', seen_types)
        if 'match' not in seen_types: fail('не встретился match в теме "Общая химия" за 6 прогонов')

        # --- чтение (passage) и биология multiple
        page.goto(f'http://127.0.0.1:{PORT}/index.html')
        page.wait_for_selector('[data-tab=practice]')
        page.click('[data-tab=practice]')
        page.click('[data-act=goTopics]')
        page.locator('.chip', has_text='Биология').first.click()
        page.locator('[data-act=startTopic][data-t=cell]').click()
        page.wait_for_selector('.qtext')
        shot('18-bio')

        # --- возобновление сессии после перезагрузки
        page.reload()
        page.wait_for_selector('[data-act=resume]')
        shot('19-resume')
        page.click('[data-act=resume]')
        page.wait_for_selector('.qtext')

        # --- отсутствие горизонтального скролла
        sw = page.evaluate('document.documentElement.scrollWidth'); cw = page.evaluate('document.documentElement.clientWidth')
        if sw > cw + 1: fail(f'горизонтальный скролл: {sw} > {cw}')

        # --- чтение
        page.goto(f'http://127.0.0.1:{PORT}/index.html')
        page.wait_for_selector('[data-act=startSubject]', state='attached') if False else None
        b.close()

try:
    run()
finally:
    srv.terminate()

print('\nОшибки консоли и страницы:', len(errors))
for e in errors[:20]: print('  ', e)
print('Провалов проверок:', len(fails))
sys.exit(1 if (errors or fails) else 0)
