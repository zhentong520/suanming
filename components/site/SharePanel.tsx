"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { buildSharePayload } from "@/lib/seo/build-metadata";
import { useShareActions } from "@/lib/wechat/share-client";

export function SharePanel({
  reportId,
  moduleTitle,
}: {
  reportId?: string;
  moduleTitle: string;
}) {
  const pathname = usePathname();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 无 reportId 或无公开链接时，系统分享只能分享页面自身链接
  const shareData = useMemo(
    () =>
      buildSharePayload(pathname, shareUrl ? `${moduleTitle}测算结果` : `${moduleTitle}测算结果`),
    [pathname, moduleTitle, shareUrl]
  );
  const shareTarget = useMemo(
    () => (shareUrl ? { ...shareData, link: shareUrl } : shareData),
    [shareData, shareUrl]
  );
  const { toast, copyLink, shareNative } = useShareActions(shareTarget);

  async function createLink() {
    if (!reportId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");
      setShareUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  async function revokeLink() {
    if (!reportId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/reports/${reportId}/share`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("撤销失败");
      setShareUrl(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "撤销失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="share-panel">
      <p className="share-panel-title">分享测算结果</p>
      {!reportId ? (
        <div className="share-panel-actions">
          <button type="button" className="share-btn" onClick={shareNative}>
            系统分享
          </button>
          <button type="button" className="share-btn share-btn--ghost" onClick={copyLink}>
            复制链接
          </button>
        </div>
      ) : shareUrl ? (
        <>
          <div className="share-link-row">
            <input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} aria-label="分享链接" />
          </div>
          <div className="share-panel-actions">
            <button type="button" className="share-btn" onClick={shareNative}>
              系统分享
            </button>
            <button type="button" className="share-btn share-btn--ghost" onClick={() => void copyLink()}>
              复制链接
            </button>
            <button type="button" className="share-btn share-btn--revoke" disabled={busy} onClick={() => void revokeLink()}>
              撤销分享
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="share-panel-desc">生成免登录只读链接，好友无需注册即可查看该份结果，可随时撤销。</p>
          <div className="share-panel-actions">
            <button type="button" className="share-btn" disabled={busy} onClick={() => void createLink()}>
              {busy ? "生成中…" : "生成分享链接"}
            </button>
            <button type="button" className="share-btn share-btn--ghost" onClick={copyLink}>
              复制本页链接
            </button>
          </div>
        </>
      )}
      {error && <p className="share-toast share-toast--error">{error}</p>}
      {toast && <p className="share-toast">{toast}</p>}
    </div>
  );
}
