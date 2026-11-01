const BASE = new URL("./", self.location.href);
const CACHE_PREFIX = `mba83-85-fam:${BASE.pathname}:`;
const CACHE = `${CACHE_PREFIX}v10.4`;
const SHELL = [
  "./", "./index.html", "./styles.css", "./data.js", "./app.js",
  "./manifest.webmanifest", "./assets/mba83-85-fam-logo.png",
  "./assets/mba83-85-fam-logo-square.jpg", "./assets/icon-192-v2.png",
  "./assets/icon-512-v2.png", "./assets/icon-maskable-512-v2.png", "./assets/apple-touch-icon.png", "./assets/favicon.png"
].map(path => new URL(path, BASE).href);
const SHELL_URLS = new Set(SHELL);

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Revalidate HTTP caches too; never install an old shell as a new version.
    await cache.addAll(SHELL.map(url => new Request(url, {cache: "reload"})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      (key.startsWith(CACHE_PREFIX) && key !== CACHE) || key === "mba83-85-fam-v10"
    ).map(key => caches.delete(key)));
    // Only obsolete app files are removed; leave other apps and user data alone.
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  // Never intercept external content, writes, or other GitHub Pages projects.
  if(request.method !== "GET" || url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const isNavigation = request.mode === "navigate";
  if(!isNavigation && !SHELL_URLS.has(url.href)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Prefer current published files, retaining the shell for offline use.
      const response = await fetch(request, {cache: "no-cache"});
      if(response.ok && response.type === "basic") {
        const key = isNavigation ? new URL("index.html", BASE).href : request;
        try {
          await cache.put(key, response.clone());
        } catch(error) {
          console.warn("PWA cache update failed:", error);
        }
      }
      return response;
    } catch(error) {
      const cached = isNavigation
        ? await cache.match(new URL("index.html", BASE).href)
        : await cache.match(request);
      if(cached) return cached;
      throw error;
    }
  })());
});
