/**
 * Статистика для рекламодателей: приложение отправляет сюда события, скрипт пишет их в Google Таблицу.
 * Бесплатно. Собираются: время, Telegram ID, событие, язык, связка, режим, предмет, процент.
 *
 * КАК ПОДКЛЮЧИТЬ (10 минут):
 * 1. Открой https://sheets.google.com, создай пустую таблицу, назови «ЕНТ статистика».
 * 2. В первой строке напиши заголовки: time, uid, event, lang, track, mode, subject, pct, id
 * 3. Меню Расширения, затем Apps Script. Удали всё, что там есть, вставь этот код целиком, нажми значок дискеты.
 * 4. Нажми Начать развёртывание, затем Новое развёртывание, тип «Веб-приложение».
 *    Выполнять от имени: «Я». У кого есть доступ: «Все». Нажми Развернуть, подтверди доступ к таблице.
 * 5. Скопируй «URL веб-приложения» (заканчивается на /exec).
 * 6. Вставь его в js/config.js в строку trackUrl: '' между кавычками. Сохрани (Commit changes на GitHub).
 *
 * Метки в таблице для медиакита: уникальные uid = пользователи, события open = запуски,
 * event=finish = завершённые тесты, поле lang и track = язык и связка.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return ContentService.createTextOutput('bad'); }
  sheet.appendRow([
    new Date(d.t || Date.now()), d.uid || '', d.ev || '', d.lang || '', d.track || '',
    d.mode || '', d.subject || '', d.pct == null ? '' : d.pct, d.id || ''
  ]);
  return ContentService.createTextOutput('ok');
}

function doGet() {
  return ContentService.createTextOutput('ok');
}
