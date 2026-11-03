// Лёгкая статистика для продажи рекламы. Если CONFIG.trackUrl пустой, ничего не отправляется.
// Отправляем минимум: Telegram ID, язык, связку, событие. Без телефонов и ИИН.
import { CONFIG } from './config.js';
import { tg } from './tg.js';

export function track(event, props = {}) {
  if (!CONFIG.trackUrl) return;
  try {
    const u = tg.user();
    const body = JSON.stringify({ t: Date.now(), uid: u ? u.id : 0, ev: event, ...props });
    if (navigator.sendBeacon) navigator.sendBeacon(CONFIG.trackUrl, new Blob([body], { type: 'text/plain' }));
    else fetch(CONFIG.trackUrl, { method: 'POST', body, mode: 'no-cors', keepalive: true });
  } catch (e) { /* статистика не должна ломать приложение */ }
}

// Отметка «открыл тренажёр» для статистики бота. Шлём подписанный Telegram initData, воркер проверяет подпись.
export function pingSeen() {
  if (!CONFIG.seenUrl || !tg.W || !tg.W.initData) return;
  try {
    fetch(CONFIG.seenUrl, { method: 'POST', body: tg.W.initData, headers: { 'content-type': 'text/plain' }, keepalive: true }).catch(() => {});
  } catch (e) { /* не мешаем приложению */ }
}
