"use client";

import { useState } from "react";
import Link from "next/link";
import { ReportPanel } from "@/components/site/Guofeng";
import { useOptionalUser } from "@/components/site/UserProvider";

export function AlmanacQueryForm({
  initialDate,
  profileId,
}: {
  initialDate?: string;
  profileId?: string;
}) {
  const userCtx = useOptionalUser();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const loggedIn = Boolean(userCtx?.user);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loggedIn) {
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    setError("");
    setReport("");
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date") ?? "");

    try {
      const res = await fetch("/api/v1/almanac", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profileId || undefined,
          params: date ? { date } : {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "查询失败");
      setReport(data.templateReport);
      void userCtx?.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!loggedIn && !userCtx?.loading ? (
        <p className="form-error" style={{ marginBottom: "0.75rem" }}>
          查询黄历请先 <Link href="/login">登录</Link>
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          日期（留空为今日）
          <input name="date" type="date" defaultValue={initialDate} />
        </label>
        <button type="submit" className="btn-primary" disabled={loading || !loggedIn}>
          {loading ? "查询中…" : !loggedIn ? "登录后查询" : "查询黄历"}
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
      {report && <ReportPanel report={report} />}
    </>
  );
}
