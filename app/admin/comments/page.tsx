"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface CommentRow {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  parentId: string | null;
  replyTo: string | null;
  status: string;
  createdAt: string;
}

export default function AdminCommentsPage() {
  const [items, setItems] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/comments?limit=100");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: "visible" | "hidden") {
    setMessage("");
    setError("");
    const res = await adminFetch("/api/admin/comments", {
      method: "PUT",
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "操作失败");
      return;
    }
    setMessage(status === "hidden" ? "已隐藏留言" : "已恢复留言");
    await load();
  }

  async function remove(id: string) {
    setMessage("");
    setError("");
    const res = await adminFetch(`/api/admin/comments?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "删除失败");
      return;
    }
    setMessage("已删除留言");
    await load();
  }

  return (
    <div className="page-container">
      <h1>留言管理</h1>
      {error && <p style={{ color: "var(--cinnabar)" }}>{error}</p>}
      {message && <p style={{ color: "var(--jade)" }}>{message}</p>}
      {loading ? (
        <p>加载中…</p>
      ) : items.length === 0 ? (
        <p>还没有留言。</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>昵称</th>
              <th>内容</th>
              <th>回复对象</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.nickname}</td>
                <td style={{ maxWidth: 320, wordBreak: "break-word" }}>{c.content}</td>
                <td>{c.replyTo ? `@${c.replyTo}` : "—"}</td>
                <td>{c.status === "visible" ? "显示" : "已隐藏"}</td>
                <td>{c.createdAt.slice(0, 19).replace("T", " ")}</td>
                <td>
                  {c.status === "visible" ? (
                    <button type="button" onClick={() => void setStatus(c.id, "hidden")}>
                      隐藏
                    </button>
                  ) : (
                    <button type="button" onClick={() => void setStatus(c.id, "visible")}>
                      恢复
                    </button>
                  )}{" "}
                  <button type="button" onClick={() => void remove(c.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
