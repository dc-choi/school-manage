self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
    // no-op: install-eligibility 충족용. respondWith 미호출 → 네트워크 통과 (캐시 X)
});
