/* Offline support: serve from cache, refresh in the background so content updates arrive on the next visit.
   Every download skips the browser's own HTTP cache, so a new version never mixes in files from an older one. */
var CACHE = 'heartward-v19';
var ART = 'heartward-art'; // paintings from Wikimedia Commons, kept across app updates
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
  'js/views/week.js',
  'js/views/extras.js',
  'js/speech.js',
  'content/en/calendar.json',
  'content/en/faq.json',
  'content/en/glossary.json',
  'content/en/guides.json',
  'content/en/paths.json',
  'content/en/prayers.json',
  'content/en/saints.json',
  'content/en/sessions.json',
  'content/en/study.json',
  'content/en/extras.json',
  'content/en/feasts.json',
  'content/es/prayers.json',
  'content/parish.json'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== ART; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var host = new URL(req.url).hostname;
  if (host === 'commons.wikimedia.org' || host === 'upload.wikimedia.org') {
    // Paintings: from the cache if we have them, otherwise fetch once and keep.
    e.respondWith(caches.open(ART).then(function (cache) {
      return cache.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; });
      });
    }));
    return;
  }
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(req, { ignoreSearch: true }).then(function (hit) {
      var fresh = fetch(req, { cache: 'no-cache' }).then(function (res) {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || fresh;
    });
  }));
});
