"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

type Category = "all" | "calc" | "non_calc";

interface OpItem {
  id: string;
  account: string;
  actionLabel: string;
  category: "calc" | "non_calc";
  categoryLabel: string;
  moduleName: string;
  reportId: string | null;
  usedAi: boolean;
  pointsSpent: number | null;
  createdAt: string;
}

export default function AdminOperationsPage() {
  const [category, setCategory] = useState<Category>("all");
  const [items, setItems] = useState<OpItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch(
        `/api/admin/operations?category=${category}&limit=${limit}&offset=${offset}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [category, offset]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1>操作记录</h1>
      <p style={{ color: "#666", margin: "0.5rem 0 1rem" }}>
        全站用户操作流水。测算类含模块测算与 AI；非测算含登录、建档等。
      </p>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {(
          [
            ["all", "全部"],
            ["calc", "测算类"],
            ["non_calc", "非测算"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="btn-primary"
            style={{
              padding: "0.35rem 0.9rem",
              opacity: category === key ? 1 : 0.55,
            }}
            onClick={() => {
              setCategory(key);
              setOffset(0);
            }}
          >
            {label}
          </button>
        ))}
        <span style={{ alignSelf: "center", color: "#888", fontSize: "0.9rem" }}>
          共 {total} 条
        </span>
      </div>

      {error && <p style={{ color: "#b83a2f" }}>{error}</p>}
      {loading ? (
        <p>加载中…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>类型</th>
              <th>操作</th>
              <th>模块</th>
              <th>使用 AI</th>
              <th>消耗积分</th>
              <th>报告</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#888" }}>
                  暂无记录
                </td>
              </tr>
            ) : (
              items.map((op) => (
                <tr key={op.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {new Date(op.createdAt).toLocaleString("zh-CN")}
                  </td>
                  <td>{op.account}</td>
                  <td>{op.categoryLabel}</td>
                  <td>{op.actionLabel}</td>
                  <td>{op.moduleName}</td>
                  <td>{op.usedAi ? "是" : "否"}</td>
                  <td>{op.pointsSpent == null ? "—" : op.pointsSpent}</td>
                  <td>
                    {op.reportId ? (
                      <a href={`/admin/reports/${op.reportId}`} target="_blank" rel="noreferrer">
                        后台洞察
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          type="button"
          className="btn-ghost"
          disabled={offset <= 0}
          onClick={() => setOffset(Math.max(0, offset - limit))}
        >
          上一页
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={offset + limit >= total}
          onClick={() => setOffset(offset + limit)}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
