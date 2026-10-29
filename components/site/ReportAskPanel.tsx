"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/** 报告追问面板：基于已生成报告的多轮问答（含跨报告记忆） */
export function ReportAskPanel({ reportId }: { reportId: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/reports/${reportId}/ask`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data: { messages?: ChatMsg[] }) => {
        if (!cancelled && data.messages) setMessages(data.messages);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, loading]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { id: `local-${Date.now()}`, role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/reports/${reportId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) {
        setError(data.error ?? "追问失败，请稍后再试");
      } else {
        setMessages((m) => [...m, { id: `local-${Date.now()}-a`, role: "assistant", content: data.answer! }]);
      }
    } catch {
      setError("网络异常，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="report-ask-panel">
      <div className="report-ask-header">
        <h4 className="report-ask-title">继续追问</h4>
        <span className="report-ai-badge">基于本报告 · 记得你问过什么</span>
      </div>
      <div className="report-ask-list" ref={listRef}>
        {messages.length === 0 && !loading && (
          <div className="report-ask-empty">有问题想深入了解？直接问我，比如「事业方向怎么选」</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`report-ask-msg report-ask-msg--${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="report-ask-msg report-ask-msg--assistant report-ask-loading">思考中…</div>}
      </div>
      {error && <div className="report-ask-error">{error}</div>}
      <div className="report-ask-input-row">
        <input
          className="report-ask-input"
          value={input}
          maxLength={500}
          placeholder="输入你的问题…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) send();
          }}
          disabled={loading}
        />
        <button className="report-ask-send" onClick={send} disabled={loading || !input.trim()}>
          发送
        </button>
      </div>
    </div>
  );
}
