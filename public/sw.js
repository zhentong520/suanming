/* 安全版 SW：不缓存页面；安装后立即交出控制权给网络 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// 不拦截任何请求 → 全部走网络，避免脏缓存刷新环
