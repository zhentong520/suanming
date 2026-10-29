"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface LedgerItem {
  id: string;
  userId: string;
  account: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}

export default function AdminLedgerPage() {
  const [userId, setUserId] = useState("");
  const [items, setItems] = useState<LedgerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("userId");
    if (q) setUserId(q);
  }, []);

  const load = useCallback(async (uid = userId) => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ limit: "50" });
      if (uid.trim()) q.set("userId", uid.trim());
      const res = await adminFetch(`/api/admin/ledger?${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h1>积分流水</h1>
      <p style={{ color: "#666", margin: "0.5rem 0 1rem" }}>
        查看赠分、测算扣分、洞察解锁等账本记录。共 {total} 条。
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="按用户 ID 筛选（可空）"
          style={{ flex: 1, maxWidth: 360, padding: "0.4rem 0.6rem" }}
        />
        <button type="button" className="btn-primary" onClick={() => load()}>
          查询
        </button>
      </div>

      {error && <p style={{ color: "#b83a2f" }}>{error}</p>}
      {loading ? (
        <p>加载中…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>账号</th>
              <th>变动</th>
              <th>余额</th>
              <th>原因</th>
              <th>关联</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#888" }}>
                  暂无流水
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(row.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td>
                    <div>{row.account}</div>
                    <div style={{ fontSize: "0.75rem", color: "#888" }}>{row.userId.slice(0, 8)}…</div>
                  </td>
                  <td style={{ color: row.delta >= 0 ? "#2f6b3a" : "#b83a2f" }}>
                    {row.delta >= 0 ? `+${row.delta}` : row.delta}
                  </td>
                  <td>{row.balanceAfter}</td>
                  <td>{row.reason}</td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {row.refType ?? "—"}
                    {row.refId ? ` · ${row.refId.slice(0, 8)}…` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
