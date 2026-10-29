"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ScrollCard, ReportPanel } from "@/components/site/Guofeng";
import { SharePanel } from "@/components/site/SharePanel";
import { useOptionalUser } from "@/components/site/UserProvider";

type ReadingModule = "face" | "palm";

const MODULE_HINTS: Record<ReadingModule, { upload: string; reject: string }> = {
  face: {
    upload: "请上传清晰的正脸照片，光线充足、五官无遮挡（不支持侧脸、手背或风景图）",
    reject: "面相分析需要面部正脸照片",
  },
  palm: {
    upload: "请上传完整手掌照片，掌纹清晰可见，建议平放自然张开（不支持人脸或模糊图）",
    reject: "手相分析需要手掌照片",
  },
};

export function ImageReadingPage({
  moduleId,
  title,
  description,
}: {
  moduleId: ReadingModule;
  title: string;
  description: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const userCtx = useOptionalUser();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [aiReport, setAiReport] = useState<string | undefined>();
  const [reportId, setReportId] = useState<string | undefined>();
  const [error, setError] = useState("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError("");
    setReport("");
    setAiReport(undefined);
    setReportId(undefined);
    if (!file) {
      setPreview(null);
      setFileName("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("图片不能超过 5MB");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userCtx?.user) {
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("请先选择照片");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("module", moduleId);
      form.append("file", file);

      const uploadRes = await fetch("/api/media/reading-image", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "上传失败");

      const profileId = userCtx?.user?.activeProfileId ?? undefined;
      const calcRes = await fetch(`/api/v1/${moduleId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          params: { imageId: uploadData.id },
        }),
      });
      const calcData = await calcRes.json();
      if (!calcRes.ok) throw new Error(calcData.error ?? "分析失败");

      setReport(calcData.templateReport);
      setAiReport(calcData.aiReport);
      setReportId(calcData.reportId);
      void userCtx?.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败");
    } finally {
      setLoading(false);
    }
  }

  const hints = MODULE_HINTS[moduleId];
  const loggedIn = Boolean(userCtx?.user);

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow">相术测算</p>
        <h1>{title}</h1>
        <p className="page-desc">{description}</p>
        <div className="page-header-line" aria-hidden />
      </header>

      <ScrollCard title="上传照片">
        {!loggedIn && !userCtx?.loading ? (
          <p className="form-error" style={{ marginBottom: "0.75rem" }}>
            测算前请先 <Link href="/login">登录</Link> 或 <Link href="/register">注册</Link>
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="image-upload-zone">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="image-upload-input"
              id={`${moduleId}-photo`}
            />
            <label htmlFor={`${moduleId}-photo`} className="image-upload-label">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="预览" className="image-upload-preview" />
              ) : (
                <div className="image-upload-placeholder">
                  <span className="image-upload-icon">📷</span>
                  <span>点击选择{moduleId === "face" ? "面部" : "手掌"}照片</span>
                  <span className="image-upload-hint">JPG / PNG / WebP，最大 5MB</span>
                </div>
              )}
            </label>
            {fileName && <p className="image-upload-name">{fileName}</p>}
            <p className="image-upload-tip">{hints.upload}</p>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !preview || !loggedIn}>
            {loading ? (
              <span className="btn-loading">
                <span className="btn-loading-dot" />
                深度识图分析中，约需 30 秒…
              </span>
            ) : !loggedIn ? (
              "登录后分析"
            ) : (
              "上传并分析"
            )}
          </button>
        </form>
        {error && (
          <p className="form-error">
            {error}
            {/积分不足/.test(error) ? (
              <>
                {" "}
                <Link href="/recharge">去充值</Link>
              </>
            ) : null}
          </p>
        )}
        <p className="image-upload-note">
          需在管理后台开启 AI 并配置识图模型（如 GPT-4o、通义千问-VL）。{hints.reject}。视觉分析按更高积分档位扣费。
          {loggedIn ? (
            <>
              {" "}
              {userCtx?.user?.activeProfileId
                ? "已绑定当前命理档案，可交叉出生年月日时辰生成更完整的人生洞察（需管理员开权限后积分解锁）。"
                : "建议先在「我的档案」设置当前档案并填写出生信息，再测算，可与八字交叉提高主题一致性。"}
            </>
          ) : null}
        </p>
      </ScrollCard>

      {report && (
        <ScrollCard title="测算结果" variant="report" className="mt-6">
          {reportId && (
            <p className="report-saved-hint">
              已存档 · <Link href={`/reports/${reportId}#insights`}>查看详情 / 解锁人生洞察</Link>
              {" · "}
              <Link href="/reports">全部历史</Link>
            </p>
          )}
          <SharePanel report={report} moduleTitle={title} />
          <ReportPanel report={report} aiReport={aiReport} />
        </ScrollCard>
      )}
    </div>
  );
}
