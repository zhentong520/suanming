"use client";

import { useEffect, useState } from "react";
import { PRIORITY_LABELS } from "@/lib/admin/labels";
import { adminFetch } from "@/lib/admin/client";

interface Mod {
  id: string;
  name: string;
  category: string;
  priority: string;
  enabled: boolean;
  implemented: boolean;
  showOnHome: boolean;
  description?: string;
}

export default function ModulesAdminPage() {
  const [modules, setModules] = useState<Mod[]>([]);

  useEffect(() => {
    adminFetch("/api/admin/modules")
      .then((r) => r.json())
      .then(setModules);
  }, []);

  async function toggle(id: string, enabled: boolean) {
    await adminFetch("/api/admin/modules", {
      method: "PUT",
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    setModules((m) => m.map((x) => (x.id === id ? { ...x, enabled: !enabled } : x)));
  }

  async function toggleHome(id: string, showOnHome: boolean) {
    await adminFetch("/api/admin/modules", {
      method: "PUT",
      body: JSON.stringify({ id, showOnHome: !showOnHome }),
    });
    setModules((m) => m.map((x) => (x.id === id ? { ...x, showOnHome: !showOnHome } : x)));
  }

  return (
    <div>
      <h1>模块管理</h1>
      <p style={{ color: "#666", margin: "0.5rem 0 1rem" }}>启停测算模块，控制是否出现在首页。</p>
      <table className="admin-table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>模块名称</th>
            <th>分类</th>
            <th>优先级</th>
            <th>已实现</th>
            <th>首页展示</th>
            <th>启用状态</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((m) => (
            <tr key={m.id}>
              <td>
                <strong>{m.name}</strong>
                {m.description ? (
                  <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 2 }}>{m.description}</div>
                ) : null}
              </td>
              <td>{m.category}</td>
              <td>{PRIORITY_LABELS[m.priority] ?? m.priority}</td>
              <td>{m.implemented ? "是" : "否"}</td>
              <td>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ padding: "0.25rem 0.75rem" }}
                  onClick={() => toggleHome(m.id, m.showOnHome)}
                >
                  {m.showOnHome ? "展示中" : "已隐藏"}
                </button>
              </td>
              <td>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: "0.25rem 0.75rem" }}
                  onClick={() => toggle(m.id, m.enabled)}
                >
                  {m.enabled ? "已启用" : "已禁用"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
