/* Vernostná kartička 30 – service worker (rozsah karta/).
   1) Upozornenia: push prichádza bez obsahu, text najnovšej správy si worker vypýta z API podľa svojho odberu.
   2) Kartička bez signálu: stránka a jej súbory sa držia v cache (sieť má prednosť, cache je záloha). */
const CACHE = 'v30-karta-1';
const SUBORY = ['./', 'karta.css', 'karta.js', 'qr.js', '../pisma/Manrope-400.woff2', '../pisma/Manrope-700.woff2'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SUBORY)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/api/')) return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && r.type === 'basic') { const kopia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request.mode === 'navigate' ? './' : e.request, kopia)); }
    return r;
  }).catch(() => caches.match(e.request.mode === 'navigate' ? './' : e.request, { ignoreSearch: e.request.mode === 'navigate' }).then((r) => r || Response.error())));
});

self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let s = null;
    try {
      const sub = await self.registration.pushManager.getSubscription();
      const r = await fetch('../api/?a=novinka', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub ? sub.endpoint : '' }), cache: 'no-store' });
      s = (await r.json()).sprava;
    } catch (err) { /* bez siete ukážeme všeobecné upozornenie */ }
    const p = s && s.prevadzka === 'headspa' ? 'headspa' : 'barbershop';
    await self.registration.showNotification(s ? s.nadpis : 'Vernostná kartička', {
      body: s ? s.text : 'Na kartičke máš novú správu.', icon: `ikony/${p}-192.png`, badge: `ikony/${p}-192.png`, tag: 'v30-sprava', data: { url: s ? s.url : './' },
    });
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url ? e.notification.data.url : './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((okna) => {
    const okno = okna.find((o) => o.url === url);
    return okno ? okno.focus() : self.clients.openWindow(url);
  }));
});
