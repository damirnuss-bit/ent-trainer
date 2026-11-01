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
