"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { isWeChatBrowser } from "@/lib/wechat/browser";

export function WeChatShareHint() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isWeChatBrowser()) return;
    const key = "yidao-wechat-hint";
    if (sessionStorage.getItem(key)) return;
    const t = window.setTimeout(() => setShow(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="wechat-share-hint" role="dialog" aria-label="微信分享提示">
      <div className="wechat-share-arrow" aria-hidden />
      <p className="wechat-share-text">点击右上角 ··· 分享给好友或添加到桌面</p>
      <button
        type="button"
        className="wechat-share-dismiss"
        onClick={() => {
          setDismissed(true);
          sessionStorage.setItem("yidao-wechat-hint", "1");
        }}
      >
        知道了
      </button>
    </div>
  );
}

/** 微信内置浏览器优化：隐藏底部提示栏占位 */
export function WeChatBodyClass() {
  useEffect(() => {
    if (isWeChatBrowser()) {
      document.body.classList.add("is-wechat");
    }
    return () => document.body.classList.remove("is-wechat");
  }, []);
  return null;
}

export function WeChatOpenInBrowserTip({ visible }: { visible?: boolean }) {
  if (!visible && typeof window !== "undefined" && !isWeChatBrowser()) return null;
  return (
    <div className={clsx("wechat-browser-tip", visible && "wechat-browser-tip--show")}>
      <span>微信内浏览已优化 · 支持添加到我的小程序/桌面</span>
    </div>
  );
}
