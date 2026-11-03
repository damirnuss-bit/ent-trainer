// Service worker: приложение открывается и при слабой связи.
// Свои файлы: сначала сеть (быстро обновляется после выкладки), если сети нет, берём из кеша.
// Внешние (KaTeX, Telegram SDK): из кеша, обновляются в фоне.
const VERSION = 'ent-v0.2.2';
const SHELL = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/app.js', './js/config.js', './js/subjects.js', './js/i18n.js', './js/render.js', './js/pool.js',
  './js/store.js', './js/tg.js', './js/track.js',
  './js/gen/index.js', './js/gen/engine.js', './js/gen/util.js', './js/gen/math.js', './js/gen/mathlit.js',
  './js/gen/physics.js', './js/gen/chemistry.js',
  './data/ads.json',
  './data/bank/history.json', './data/bank/reading.json', './data/bank/physics.json',
  './data/bank/chemistry.json', './data/bank/biology.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

function networkFirst(req) {
  return new Promise((resolve) => {
    let done = false;
    const fallback = () => caches.match(req).then((hit) => hit || caches.match('./index.html'));
    const timer = setTimeout(() => { if (!done) fallback().then((r) => { if (r && !done) { done = true; resolve(r); } }); }, 3500);
    fetch(req).then((res) => {
      clearTimeout(timer);
      if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      if (!done) { done = true; resolve(res); }
    }).catch(() => { clearTimeout(timer); if (!done) fallback().then((r) => { done = true; resolve(r || Response.error()); }); });
  });
}

function staleWhileRevalidate(req) {
  return caches.open(VERSION).then((c) => c.match(req).then((hit) => {
    const net = fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) { e.respondWith(networkFirst(req)); return; }
  if (/cdn\.jsdelivr\.net|telegram\.org/.test(url.hostname)) e.respondWith(staleWhileRevalidate(req));
});
