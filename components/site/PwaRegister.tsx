"use client";

import { useEffect } from "react";

/**
 * 暂时只做「卸载旧 SW + 清缓存」，不再重新注册。
 * 旧版 sw.js 曾 cache-first 缓存了 / 与错误的 manifest，导致页面无限刷新。
 * 稳定后再考虑恢复离线缓存。
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return null;
}

export function SplashMeta() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "apple-touch-startup-image";
    link.href = "/icons/splash.svg";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  return null;
}
