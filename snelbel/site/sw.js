// Snelbel werkt ook zonder internet: eerst het netwerk proberen, anders de bewaarde kopie.
var C = 'snelbel-v5';
self.addEventListener('install', function (e) { e.waitUntil(caches.open(C).then(function (c) { return c.addAll(['./', 'manifest.webmanifest', 'icon-192.png']); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (r && (r.ok || r.type === 'opaque')) { var k = r.clone(); caches.open(C).then(function (c) { c.put(e.request, k); }); }
    return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
