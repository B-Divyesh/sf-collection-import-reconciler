const CACHE = 'catalog-reconciler-v4';
const SHELL = ['/', '/demo', '/privacy', '/terms', '/404.html', '/404.css', '/mark.svg', '/apple-touch-icon.png', '/manifest.webmanifest', '/assets/hero-ledgers-768.webp'];
self.addEventListener('install', (event) => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const homeResponse = await fetch(new Request('/', { cache: 'reload' }));
  await cache.put('/', homeResponse.clone());
  const home = await homeResponse.text();
  const builtAssets = [...home.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map((match) => match[1]);
  for (const url of [...SHELL.slice(1), ...builtAssets]) {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (!response.ok) throw new Error(`Could not cache ${url}`);
    await cache.put(url, response);
  }
  await self.skipWaiting();
})()));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreVary: true });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) (await caches.open(CACHE)).put(event.request, response.clone());
      return response;
    } catch {
      if (event.request.mode === 'navigate') return caches.match('/404.html');
      throw new Error('The requested file is not available offline.');
    }
  })());
});
