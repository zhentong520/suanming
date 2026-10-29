"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  role: string;
  status: string;
  pointsBalance: number;
  allowLifeInsights: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [giftAmount, setGiftAmount] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/users?q=${encodeURIComponent(q)}&limit=50`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "加载失败");
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(userId: string, status: "active" | "disabled") {
    setMessage("");
    setError("");
    const res = await adminFetch("/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ action: "set_status", userId, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "操作失败");
      return;
    }
    setMessage(status === "disabled" ? "已停用用户" : "已启用用户");
    await load();
  }

  async function setAllowLifeInsights(userId: string, allow: boolean) {
    setMessage("");
    setError("");
    const res = await adminFetch("/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ action: "set_allow_life_insights", userId, allow }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "操作失败");
      return;
    }
    setMessage(allow ? "已允许该用户查看人生洞察（仍需扣积分解锁）" : "已关闭该用户人生洞察权限");
    await load();
  }

  async function gift(userId: string) {
    setMessage("");
    setError("");
    const amount = Math.floor(Number(giftAmount[userId] ?? 0));
    if (amount <= 0) {
      setError("请输入正整数积分");
      return;
    }
    const res = await adminFetch("/api/admin/users", {
      method: "PUT",
      body: JSON.stringify({ action: "gift_points", userId, amount }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "赠送失败");
      return;
    }
    setMessage(`已赠送 ${amount} 积分，余额 ${data.balance}`);
    setGiftAmount((prev) => ({ ...prev, [userId]: "" }));
    await load();
  }

  return (
    <div>
      <h1>用户管理</h1>
      <p style={{ color: "#666", margin: "0.5rem 0 1rem" }}>
        管理注册用户：启停账号、赠送积分（单次默认上限 10000）、是否允许解锁人生洞察（流年倾向 + 六亲时间线）。共{" "}
        {total} 人。
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索邮箱 / 手机 / 昵称"
          style={{ flex: 1, maxWidth: 320, padding: "0.4rem 0.6rem" }}
        />
        <button type="button" className="btn-primary" onClick={() => load()}>
          搜索
        </button>
      </div>

      {error && <p style={{ color: "#b83a2f" }}>{error}</p>}
      {message && <p style={{ color: "#2f6b3a" }}>{message}</p>}
      {loading ? (
        <p>加载中…</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>账号</th>
              <th>角色</th>
              <th>状态</th>
              <th>积分</th>
              <th>人生洞察</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "#888" }}>
                  暂无用户
                </td>
              </tr>
            ) : (
              items.map((u) => {
                const account = u.email || u.phone || u.displayName || u.id.slice(0, 8);
                return (
                  <tr key={u.id}>
                    <td>
                      <div>{account}</div>
                      {u.displayName && (u.email || u.phone) ? (
                        <div style={{ fontSize: "0.8rem", color: "#888" }}>{u.displayName}</div>
                      ) : null}
                    </td>
                    <td>{u.role === "admin" ? "管理员" : "用户"}</td>
                    <td>{u.status === "disabled" ? "已停用" : "正常"}</td>
                    <td>{u.pointsBalance}</td>
                    <td>{u.allowLifeInsights ? "允许" : "关闭"}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(u.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
                        {u.status === "disabled" ? (
                          <button type="button" className="btn-primary" onClick={() => setStatus(u.id, "active")}>
                            启用
                          </button>
                        ) : (
                          <button type="button" className="btn-primary" onClick={() => setStatus(u.id, "disabled")}>
                            停用
                          </button>
                        )}
                        {u.allowLifeInsights ? (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => setAllowLifeInsights(u.id, false)}
                          >
                            关洞察
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => setAllowLifeInsights(u.id, true)}
                          >
                            开洞察
                          </button>
                        )}
                        <input
                          value={giftAmount[u.id] ?? ""}
                          onChange={(e) => setGiftAmount((p) => ({ ...p, [u.id]: e.target.value }))}
                          placeholder="≤10000"
                          style={{ width: 72, padding: "0.25rem" }}
                        />
                        <button type="button" className="btn-primary" onClick={() => gift(u.id)}>
                          赠送
                        </button>
                        <a
                          href={`/admin/ledger?userId=${encodeURIComponent(u.id)}`}
                          className="btn-primary"
                          style={{ textDecoration: "none", display: "inline-block", padding: "0.25rem 0.5rem" }}
                        >
                          流水
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
