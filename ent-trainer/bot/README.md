# Бот @enttrainer_bot

Файл `worker.js` отвечает на /start приветствием и кнопкой «Открыть тренажёр».
Хостинг: Cloudflare Workers, бесплатно.

1. dash.cloudflare.com → зарегистрироваться.
2. Workers & Pages → Create → Start with Hello World → имя `ent-bot` → Deploy.
3. Edit code → удалить всё → вставить `worker.js` → Deploy.
4. Settings → Variables and Secrets → Add → тип Secret, имя `BOT_TOKEN`, значение = токен из BotFather → Deploy.
5. Открыть в браузере `https://ent-bot.<ваш-поддомен>.workers.dev/setup` → должно быть «Готово ✅».

Шаг 5 сам ставит вебхук, описание бота (видно до нажатия «Старт»), команды и кнопку меню «Тренажёр».
Если меняете адрес приложения, поправьте `APP_URL` в начале файла и повторите шаг 5.

## Статистика: команда /stats
Пишет в бот только владелец (`mariachiman88`, или Telegram ID в переменной `OWNER_ID`). Показывает всего пользователей, новых и активных за день/неделю/месяц.

Нужна база D1 (один раз):
1. Workers & Pages → D1 → Create database → имя `ent-bot-stats`.
2. Воркер `ent-bot` → Settings → Bindings → Add → D1 database → Variable name `DB`, база `ent-bot-stats` → Deploy.
3. Открыть `/setup` (создаст таблицу).

Учёт идёт с момента подключения базы: кто писал боту и кто открывал тренажёр (приложение шлёт подписанный initData на `/seen`, воркер проверяет подпись).
