"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface DashData {
  totalCalls: number;
  todayCalls: number;
  todayKey: string;
  timezone: string;
  dailyTrend: Array<{ date: string; count: number }>;
  stats: Array<{
    moduleId: string;
    moduleName: string;
    callCount: number;
    todayCount: number;
    lastCalledAt: string | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/dashboard")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "加载失败");
        setData(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"));
  }, []);

  const maxTrend = Math.max(1, ...(data?.dailyTrend.map((d) => d.count) ?? [1]));

  return (
    <div>
      <h1>仪表盘</h1>
      {error && <p style={{ color: "#b83a2f" }}>{error}</p>}
      {data && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
              margin: "1rem 0 1.5rem",
            }}
          >
            <div style={{ border: "1px solid var(--border, #d4c4a8)", padding: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>总测算</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{data.totalCalls}</div>
            </div>
            <div style={{ border: "1px solid var(--border, #d4c4a8)", padding: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>今日测算</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{data.todayCalls}</div>
              <div style={{ fontSize: "0.75rem", color: "#888" }}>
                {data.todayKey}（上海时区，跨日自动清零）
              </div>
            </div>
          </div>

          <h2>近 14 日趋势</h2>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.35rem",
              height: 140,
              margin: "0.75rem 0 1.5rem",
              padding: "0.5rem",
              border: "1px solid var(--border, #d4c4a8)",
              background: "rgba(255,253,248,0.9)",
            }}
          >
            {data.dailyTrend.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count}`}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}
              >
                <span style={{ fontSize: "0.65rem", color: "#666", marginBottom: 4 }}>{d.count}</span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 28,
                    height: `${Math.max(4, (d.count / maxTrend) * 100)}%`,
                    background: "var(--cinnabar, #b83a2f)",
                    opacity: 0.85,
                  }}
                />
                <span style={{ fontSize: "0.6rem", color: "#999", marginTop: 4 }}>{d.date.slice(5)}</span>
              </div>
            ))}
          </div>

          <h2>模块排行</h2>
          <table className="admin-table" style={{ marginTop: "0.75rem" }}>
            <thead>
              <tr>
                <th>模块</th>
                <th>累计</th>
                <th>今日</th>
                <th>最近调用</th>
              </tr>
            </thead>
            <tbody>
              {data.stats.map((s) => (
                <tr key={s.moduleId}>
                  <td>{s.moduleName}</td>
                  <td>{s.callCount}</td>
                  <td>{s.todayCount}</td>
                  <td>{s.lastCalledAt ? new Date(s.lastCalledAt).toLocaleString("zh-CN") : "—"}</td>
                </tr>
              ))}
              {data.stats.length === 0 && (
                <tr>
                  <td colSpan={4}>暂无调用</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
      {!data && !error && <p>加载中…</p>}
    </div>
  );
}
