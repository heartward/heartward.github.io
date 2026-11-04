/* Offline support: serve from cache, refresh in the background so content updates arrive on the next visit. */
var CACHE = 'heartward-v6';
var SHELL = [
  './',
  'index.html',
  'css/styles.css',
  'lib/qrcode.js',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'js/data.js',
  'js/figures.js',
  'js/i18n-es.js',
  'js/icons.js',
  'js/liturgy.js',
  'js/main.js',
  'js/store.js',
  'js/ui.js',
  'js/views/journey.js',
  'js/views/learn.js',
  'js/views/me.js',
  'js/views/pray.js',
  'js/views/search.js',
  'js/views/today.js',
  'content/en/calendar.json',
  'content/en/faq.json',
  'content/en/glossary.json',
  'content/en/guides.json',
  'content/en/paths.json',
  'content/en/prayers.json',
  'content/en/saints.json',
  'content/en/sessions.json',
  'content/es/prayers.json',
  'content/parish.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || fresh;
    });
  }));
});
