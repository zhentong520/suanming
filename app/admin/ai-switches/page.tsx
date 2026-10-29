"use client";

import { useEffect, useState } from "react";
import { allModuleNameMap } from "@/lib/admin/labels";
import { adminFetch } from "@/lib/admin/client";

export default function AiSwitchesPage() {
  const [globalAi, setGlobalAi] = useState(false);
  const [modules, setModules] = useState<Array<{ moduleId: string; aiEnabled: boolean }>>([]);
  const nameMap = allModuleNameMap();

  useEffect(() => {
    adminFetch("/api/admin/ai-switches")
      .then((r) => r.json())
      .then((d) => {
        const g = d.global?.find((x: { key: string; value: string }) => x.key === "global_ai_enabled");
        setGlobalAi(g?.value === "true");
        setModules(d.modules ?? []);
      });
  }, []);

  async function toggleGlobal() {
    await adminFetch("/api/admin/ai-switches", {
      method: "PUT",
      body: JSON.stringify({ globalAiEnabled: !globalAi }),
    });
    setGlobalAi(!globalAi);
  }

  async function toggleModule(moduleId: string, aiEnabled: boolean) {
    await adminFetch("/api/admin/ai-switches", {
      method: "PUT",
      body: JSON.stringify({ moduleId, aiEnabled: !aiEnabled }),
    });
    setModules((m) => m.map((x) => (x.moduleId === moduleId ? { ...x, aiEnabled: !aiEnabled } : x)));
  }

  return (
    <div>
      <h1>AI 开关控制</h1>
      <div style={{ margin: "1.5rem 0" }}>
        <button type="button" className="btn-primary" onClick={toggleGlobal}>
          全局 AI：{globalAi ? "已开启" : "已关闭（默认）"}
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>模块名称</th>
            <th>AI 解读</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((m) => (
            <tr key={m.moduleId}>
              <td>{nameMap[m.moduleId] ?? m.moduleId}</td>
              <td>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: "0.25rem 0.75rem" }}
                  onClick={() => toggleModule(m.moduleId, m.aiEnabled)}
                >
                  {m.aiEnabled ? "已开启" : "已关闭"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
