"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { buildSharePayload } from "@/lib/seo/build-metadata";
import { useShareActions } from "@/lib/wechat/share-client";

export function SharePanel({
  report,
  moduleTitle,
}: {
  report: string;
  moduleTitle: string;
}) {
  const pathname = usePathname();
  const snippet = report.replace(/【.+?】/g, "").trim().slice(0, 120);
  const shareData = useMemo(
    () =>
      buildSharePayload(pathname, snippet || `${moduleTitle}测算结果`),
    [pathname, snippet, moduleTitle]
  );

  const { toast, copyLink, shareNative, shareWeChatHint, wxReady, isWeChat } = useShareActions(shareData);

  return (
    <div className="share-panel">
      <p className="share-panel-title">分享测算结果</p>
      <div className="share-panel-actions">
        {isWeChat ? (
          <button type="button" className="share-btn share-btn--wechat" onClick={shareWeChatHint}>
            {wxReady ? "微信分享已就绪" : "微信分享"}
          </button>
        ) : (
          <button type="button" className="share-btn" onClick={shareNative}>
            系统分享
          </button>
        )}
        <button type="button" className="share-btn share-btn--ghost" onClick={copyLink}>
          复制链接
        </button>
      </div>
      {toast && <p className="share-toast">{toast}</p>}
    </div>
  );
}
