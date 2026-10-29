"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface ContentFile {
  id: string;
  file: string;
  title: string;
  description: string;
  bytes: number;
  updatedAt: string;
}

export default function ContentAdminPage() {
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/content");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      const list = (data.files ?? []) as ContentFile[];
      setFiles(list);
      setSelectedId((prev) => prev || list[0]?.id || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFile = useCallback(async (id: string) => {
    if (!id) return;
    setError("");
    setMessage("");
    try {
      const res = await adminFetch(`/api/admin/content?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "读取失败");
      setTitle(data.title ?? id);
      setText(data.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取失败");
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) loadFile(selectedId);
  }, [selectedId, loadFile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await adminFetch("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify({ id: selectedId, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setMessage(data.note ?? "已保存");
      await loadList();
      await loadFile(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>内容管理</h1>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        编辑 <code>content/*.json</code>。保存后写入磁盘并同步 <code>content_items</code>；引擎按文件修改时间热加载。
      </p>

      {loading && <p>加载中…</p>}
      {error && <p style={{ color: "#b83a2f" }}>{error}</p>}
      {message && <p style={{ color: "#3d5a4c" }}>{message}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "1.25rem", alignItems: "start" }}>
        <div style={{ border: "1px solid #ddd", padding: "0.75rem", maxHeight: "70vh", overflow: "auto" }}>
          {files.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedId(f.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.6rem 0.5rem",
                marginBottom: "0.25rem",
                border: "none",
                background: selectedId === f.id ? "rgba(166,124,46,0.15)" : "transparent",
                cursor: "pointer",
                fontWeight: selectedId === f.id ? 700 : 400,
              }}
            >
              <div>{f.title}</div>
              <div style={{ fontSize: "0.75rem", color: "#888" }}>
                {f.file} · {(f.bytes / 1024).toFixed(1)} KB
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSave}>
          <h2 style={{ marginBottom: "0.5rem" }}>{title || "选择文件"}</h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              minHeight: "420px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              fontSize: "0.85rem",
              lineHeight: 1.45,
              padding: "0.75rem",
              border: "1px solid #ccc",
            }}
          />
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button type="submit" className="btn-primary" disabled={saving || !selectedId} style={{ width: "auto", padding: "0.6rem 1.25rem" }}>
              {saving ? "保存中…" : "保存 JSON"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => selectedId && loadFile(selectedId)}
              disabled={!selectedId}
            >
              重新加载
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
