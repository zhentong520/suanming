"use client";

import { useCallback, useEffect, useState } from "react";
import { isWeChatBrowser } from "@/lib/wechat/browser";

export interface ShareData {
  title: string;
  desc: string;
  link: string;
  imageUrl: string;
}

declare global {
  interface Window {
    wx?: {
      config: (cfg: Record<string, unknown>) => void;
      ready: (fn: () => void) => void;
      error: (fn: (err: unknown) => void) => void;
      updateAppMessageShareData: (data: Record<string, string>) => void;
      updateTimelineShareData: (data: Record<string, string>) => void;
    };
  }
}

let wxScriptPromise: Promise<void> | null = null;

function loadWxScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.wx) return Promise.resolve();
  if (wxScriptPromise) return wxScriptPromise;

  wxScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("微信 JSSDK 加载失败"));
    document.head.appendChild(s);
  });
  return wxScriptPromise;
}

export async function initWeChatShare(data: ShareData): Promise<boolean> {
  if (!isWeChatBrowser()) return false;

  const pageUrl = window.location.href.split("#")[0];
  const res = await fetch(`/api/wechat/jssdk-config?url=${encodeURIComponent(pageUrl)}`, {
    credentials: "include",
  });
  const cfg = await res.json();
  if (!cfg.enabled) return false;

  await loadWxScript();
  const wx = window.wx;
  if (!wx) return false;

  return new Promise((resolve) => {
    wx.config({
      debug: false,
      appId: cfg.appId,
      timestamp: cfg.timestamp,
      nonceStr: cfg.nonceStr,
      signature: cfg.signature,
      jsApiList: ["updateAppMessageShareData", "updateTimelineShareData"],
    });

    wx.ready(() => {
      wx.updateAppMessageShareData({
        title: data.title,
        desc: data.desc,
        link: data.link,
        imgUrl: data.imageUrl,
      });
      wx.updateTimelineShareData({
        title: data.title,
        link: data.link,
        imgUrl: data.imageUrl,
      });
      resolve(true);
    });

    wx.error(() => resolve(false));
  });
}

export function useWeChatShare(data: ShareData | null, active: boolean) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active || !data || !isWeChatBrowser()) {
      setReady(false);
      return;
    }
    initWeChatShare(data).then(setReady);
  }, [active, data?.title, data?.link, data?.desc, data?.imageUrl]);

  return ready;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function nativeShare(data: ShareData): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title: data.title, text: data.desc, url: data.link });
    return true;
  } catch {
    return false;
  }
}

export function useShareActions(data: ShareData | null) {
  const [toast, setToast] = useState<string | null>(null);
  const wxReady = useWeChatShare(data, !!data);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const copyLink = useCallback(async () => {
    if (!data) return;
    const ok = await copyToClipboard(data.link);
    showToast(ok ? "链接已复制" : "复制失败，请手动复制");
  }, [data, showToast]);

  const shareNative = useCallback(async () => {
    if (!data) return;
    const ok = await nativeShare(data);
    if (!ok) showToast("当前环境不支持系统分享");
  }, [data, showToast]);

  const shareWeChatHint = useCallback(() => {
    showToast(wxReady ? "已配置分享，请点击右上角 ··· 发送" : "请点击右上角 ··· 分享给好友");
  }, [wxReady, showToast]);

  return { toast, copyLink, shareNative, shareWeChatHint, wxReady, isWeChat: isWeChatBrowser() };
}
