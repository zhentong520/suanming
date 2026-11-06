"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/site/Guofeng";
import { useOptionalUser } from "@/components/site/UserProvider";

interface CommentItem {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  parentId: string | null;
  replyTo: string | null;
  createdAt: string;
  canDelete: boolean;
}

const PAGE_SIZE = 20;
const MAX_LENGTH = 500;

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day} 天前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LiuyanWall() {
  const ctx = useOptionalUser();
  const user = ctx?.user ?? null;

  const [items, setItems] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?limit=${PAGE_SIZE}&offset=0`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/comments?limit=${PAGE_SIZE}&offset=${items.length}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setItems((prev) => [...prev, ...(data.items ?? [])]);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoadingMore(false);
    }
  }

  async function submit() {
    setError("");
    setNotice("");
    if (!content.trim()) {
      setError("写点什么再发布吧");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentId: replyTo?.id ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "发布失败");
      setContent("");
      setReplyTo(null);
      setNotice("留言已发布");
      // 新留言插到最前（列表倒序）
      if (data.item) setItems((prev) => [data.item as CommentItem, ...prev]);
      setTotal((t) => t + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "发布失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "删除失败");
      setItems((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
      setTotal((t) => Math.max(0, t - 1));
      setNotice("已删除");
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    }
  }

  function startReply(item: CommentItem) {
    // 仅一层回复：回复的回复仍挂到顶层
    const top = item.parentId ? items.find((c) => c.id === item.parentId) ?? null : item;
    setReplyTo(top);
    setError("");
    setNotice("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const hasMore = items.length < total;

  return (
    <div className="liuyan-wall">
      <SectionHeading title="留言墙" subtitle="有缘相逢，留下几句话" />

      <div className="liuyan-form scroll-card" ref={formRef}>
        {user ? (
          <>
            {replyTo && (
              <div className="liuyan-replying">
                回复 <strong>@{replyTo.nickname}</strong>
                <button
                  type="button"
                  className="liuyan-reply-cancel"
                  onClick={() => setReplyTo(null)}
                  aria-label="取消回复"
                >
                  ✕
                </button>
              </div>
            )}
            <textarea
              className="liuyan-input"
              value={content}
              maxLength={MAX_LENGTH}
              placeholder="写点想说的…（最多 500 字）"
              rows={4}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="liuyan-form-actions">
              <span className="liuyan-count">{content.length}/{MAX_LENGTH}</span>
              <button
                type="button"
                className="btn-primary"
                disabled={submitting || !content.trim()}
                onClick={() => void submit()}
              >
                {submitting ? "发布中…" : "◆ 发布留言"}
              </button>
            </div>
          </>
        ) : (
          <div className="liuyan-login-hint">
            <p>留言前请先登录，游客可以随便看。</p>
            <div className="liuyan-login-actions">
              <Link href="/login" className="btn-primary">登录</Link>
              <Link href="/register" className="site-nav-link">注册账号</Link>
            </div>
          </div>
        )}
        {error && <p className="liuyan-msg liuyan-msg--error">{error}</p>}
        {notice && <p className="liuyan-msg">{notice}</p>}
      </div>

      <div className="liuyan-list">
        {loading ? (
          <p className="liuyan-empty">加载中…</p>
        ) : items.length === 0 ? (
          <p className="liuyan-empty">还没有留言，来当第一个吧。</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="liuyan-item scroll-card">
              <header className="liuyan-item-head">
                <span className="liuyan-nickname">{item.nickname}</span>
                <time className="liuyan-time">{formatTime(item.createdAt)}</time>
              </header>
              {item.replyTo && (
                <p className="liuyan-reply-tag">回复 @{item.replyTo}</p>
              )}
              <p className="liuyan-content">{item.content}</p>
              <footer className="liuyan-item-actions">
                {user && (
                  <button type="button" className="liuyan-action" onClick={() => startReply(item)}>
                    回复
                  </button>
                )}
                {item.canDelete && (
                  <button
                    type="button"
                    className="liuyan-action liuyan-action--danger"
                    onClick={() => void remove(item.id)}
                  >
                    删除
                  </button>
                )}
              </footer>
            </article>
          ))
        )}
      </div>

      {hasMore && (
        <div className="liuyan-more">
          <button
            type="button"
            className="site-nav-link"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? "加载中…" : `查看更多（共 ${total} 条）`}
          </button>
        </div>
      )}
    </div>
  );
}
