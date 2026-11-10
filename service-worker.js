// PRUMO — cache versionado. Atualizações não apagam localStorage.
const CACHE = "norte-static-v9";
const STATIC = [
  "./",
  "./index.html",
  "./styles.css?v=20261110i",
  "./app.js?v=20261110i",
  "./config.js?v=20261110i",
  "./manifest.webmanifest?v=20261110i",
  "./icon.svg?v=20261110i"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(STATIC))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys()
    .then(names => Promise.all(names.filter(name => name.startsWith("norte-static-") && name !== CACHE).map(name => caches.delete(name))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request)
    .then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
      }
      return response;
    })
    .catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html"))));
});