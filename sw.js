/* Jarvis Service Worker: immer zuerst das Netz fragen, damit Updates sofort ankommen.
   Ohne Netz liefert er die zuletzt geladene Version aus dem Speicher. */
const CACHE = "jarvis-offline";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: "no-store" });
      if (res && res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") {
        const home = (await caches.match("./")) || (await caches.match("index.html"));
        if (home) return home;
      }
      throw err;
    }
  })());
});
