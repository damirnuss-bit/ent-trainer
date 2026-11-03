# Автопостинг в Threads

GitHub Actions (`.github/workflows/threads.yml`) 6 раз в день запускает `post.py`, он публикует из `queue.json`
посты, у которых подошло время (`at`, время Алматы), и записывает их в `posted.json`. Раз в неделю продлевает токен.
Новые посты на неделю раз в неделю дописывает Claude в `queue.json` (правила в `STYLE.md`, проверка `check.py`).

## Настройка один раз
1. developers.facebook.com → My Apps → Create app → сценарий «Access the Threads API».
2. В приложении: Use cases → Threads API → Customize: включить `threads_basic` и `threads_content_publish`.
   Settings: в Redirect Callback URLs, Uninstall и Delete callback вписать `https://oauth.pstmn.io/v1/callback` (любой https подойдёт).
3. App roles → Roles → Add People → Threads Tester → свой аккаунт Threads. Принять приглашение:
   threads.net → Настройки → Аккаунт → Сайты и приложения → Приглашения.
4. Use cases → Threads API → Settings → User Token Generator → Generate access token (выдаёт долгоживущий токен на 60 дней).
5. GitHub → репо → Settings → Secrets and variables → Actions → New secret: `THREADS_TOKEN` = токен.
6. Для автопродления токена: github.com/settings/personal-access-tokens → fine-grained, только этот репо,
   права Secrets: Read and write → секрет `GH_PAT`.
7. Actions → Threads → Run workflow, чтобы проверить.
