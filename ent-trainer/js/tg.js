// Обёртка над Telegram WebApp SDK. Вне Telegram (в браузере) всё работает на запасных вариантах.
const W = (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) || null;
export const inTelegram = !!(W && W.initData);

let mbHandler = null, bbHandler = null;
const fallbackMB = () => document.getElementById('mb');
const fallbackBB = () => document.getElementById('bb');

export const tg = {
  W,
  init() {
    if (!inTelegram) {
      // в обычном браузере кнопки Telegram заменяют обычные
      const mb = document.getElementById('mb'), bb = document.getElementById('bb');
      if (mb) mb.addEventListener('click', () => tg._mbWrap());
      if (bb) bb.addEventListener('click', () => tg._bbWrap());
    }
    if (W) {
      try {
        W.ready();
        W.expand();
        if (W.disableVerticalSwipes) W.disableVerticalSwipes();
        if (W.setHeaderColor) W.setHeaderColor('bg_color');
      } catch (e) { /* старые версии */ }
    }
  },
  user() {
    return (W && W.initDataUnsafe && W.initDataUnsafe.user) || null;
  },
  version() { return W ? W.version : null; },
  isDark() { return W ? W.colorScheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; },
  onTheme(fn) { if (W && W.onEvent) W.onEvent('themeChanged', fn); },

  haptic(kind) {
    try {
      const h = W && W.HapticFeedback;
      if (!h) { if (navigator.vibrate) navigator.vibrate(kind === 'error' ? [30, 40, 30] : 15); return; }
      if (kind === 'success') h.notificationOccurred('success');
      else if (kind === 'error') h.notificationOccurred('error');      // двойная вибрация на ошибку
      else if (kind === 'select') h.selectionChanged();
      else h.impactOccurred('light');
    } catch (e) { /* без вибрации */ }
  },

  // Главная кнопка: «Далее», «Завершить»
  main(text, fn, opts = {}) {
    mbHandler = fn;
    if (inTelegram && W.MainButton) {
      const B = W.MainButton;
      B.offClick(tg._mbWrap);
      B.setText(text);
      B.onClick(tg._mbWrap);
      B.show();
      if (opts.disabled) B.disable(); else B.enable();
    } else {
      const el = fallbackMB();
      if (!el) return;
      el.textContent = text;
      el.hidden = false;
      el.disabled = !!opts.disabled;
    }
  },
  _mbWrap() { if (mbHandler) mbHandler(); },
  mainHide() {
    mbHandler = null;
    if (inTelegram && W.MainButton) W.MainButton.hide();
    else { const el = fallbackMB(); if (el) el.hidden = true; }
  },

  // Кнопка «Назад»
  back(fn) {
    bbHandler = fn;
    if (inTelegram && W.BackButton) {
      W.BackButton.offClick(tg._bbWrap);
      if (fn) { W.BackButton.onClick(tg._bbWrap); W.BackButton.show(); } else W.BackButton.hide();
    } else {
      const el = fallbackBB();
      if (el) el.hidden = !fn;
    }
  },
  _bbWrap() { if (bbHandler) bbHandler(); },

  confirm(msg) {
    return new Promise((res) => {
      if (inTelegram && W.showConfirm) W.showConfirm(msg, (ok) => res(!!ok));
      else res(window.confirm(msg));
    });
  },
  alert(msg) {
    return new Promise((res) => {
      if (inTelegram && W.showAlert) W.showAlert(msg, () => res());
      else { window.alert(msg); res(); }
    });
  },
  openLink(url) {
    if (W && W.openLink) W.openLink(url); else window.open(url, '_blank', 'noopener');
  },
  openTg(url) {
    if (W && W.openTelegramLink) W.openTelegramLink(url); else window.open(url, '_blank', 'noopener');
  },

  // Облачное хранилище Telegram (CloudStorage) с запасным localStorage
  cloud: {
    available() { return !!(W && W.CloudStorage && inTelegram && W.isVersionAtLeast && W.isVersionAtLeast('6.9')); },
    getMany(keys) {
      return new Promise((res) => {
        if (!tg.cloud.available()) return res(null);
        const t = setTimeout(() => res(null), 4000);
        try {
          W.CloudStorage.getItems(keys, (err, vals) => { clearTimeout(t); res(err ? null : vals); });
        } catch (e) { clearTimeout(t); res(null); }
      });
    },
    set(key, value) {
      return new Promise((res) => {
        if (!tg.cloud.available()) return res(false);
        const t = setTimeout(() => res(false), 4000);
        try {
          W.CloudStorage.setItem(key, value, (err, ok) => { clearTimeout(t); res(!err && !!ok); });
        } catch (e) { clearTimeout(t); res(false); }
      });
    },
  },
};
