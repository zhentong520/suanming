"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface Provider {
  id: string;
  name: string;
  providerType: string;
  baseUrl: string;
  modelName: string;
  isActive: boolean;
  keyEncrypted?: boolean;
}

interface VolcModel {
  id: string;
  label: string;
  use: string;
  vision: boolean;
}

export default function AiProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<VolcModel[]>([]);
  const [message, setMessage] = useState("");

  async function refresh() {
    const [list, meta] = await Promise.all([
      adminFetch("/api/admin/ai-providers").then((r) => r.json()),
      adminFetch("/api/admin/ai-providers?meta=1").then((r) => r.json()),
    ]);
    setProviders(Array.isArray(list) ? list : list.providers ?? []);
    setModels(meta.models ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addProvider(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const res = await adminFetch("/api/admin/ai-providers", {
      method: "POST",
      body: JSON.stringify({
        name: fd.get("name"),
        providerType: fd.get("providerType"),
        baseUrl: fd.get("baseUrl"),
        apiKey: fd.get("apiKey"),
        modelName: fd.get("modelName"),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "添加失败");
      return;
    }
    setMessage("已添加");
    await refresh();
    e.currentTarget.reset();
  }

  async function syncVolc() {
    setMessage("");
    const res = await adminFetch("/api/admin/ai-providers", {
      method: "POST",
      body: JSON.stringify({ action: "sync-volc" }),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error ?? "");
    await refresh();
  }

  return (
    <div>
      <h1>AI 模型配置</h1>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        支持 OpenAI 兼容接口与<strong>火山方舟 Agent / Token Plan</strong>（
        <code>api/plan/v3</code>）。识图请用 Seed 2.0（lite/mini/pro），勿用{" "}
        <code>doubao-1.5-vision-pro</code>（Plan 不支持）。Key 加密入库。
      </p>

      <button type="button" className="btn-primary" style={{ width: "auto", marginBottom: "1rem" }} onClick={syncVolc}>
        从环境变量同步火山方舟
      </button>
      {message && <p style={{ color: "#3d5a4c" }}>{message}</p>}

      {models.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h2>推荐模型（按业务选用）</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>模型 ID</th>
                <th>名称</th>
                <th>适用</th>
                <th>识图</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td>
                    <code>{m.id}</code>
                  </td>
                  <td>{m.label}</td>
                  <td>{m.use}</td>
                  <td>{m.vision ? "是" : "否"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={addProvider} className="form-grid" style={{ maxWidth: 560, marginBottom: "2rem" }}>
        <label>
          名称
          <input name="name" required placeholder="火山方舟 Token Plan" defaultValue="火山方舟 Token Plan" />
        </label>
        <label>
          类型
          <select name="providerType" defaultValue="volcengine">
            <option value="volcengine">火山方舟</option>
            <option value="openai">OpenAI</option>
            <option value="deepseek">DeepSeek</option>
            <option value="qwen">通义千问</option>
            <option value="zhipu">智谱</option>
            <option value="moonshot">Moonshot</option>
            <option value="custom">自定义</option>
          </select>
        </label>
        <label>
          Base URL
          <input
            name="baseUrl"
            required
            placeholder="https://ark.cn-beijing.volces.com/api/plan/v3"
            defaultValue="https://ark.cn-beijing.volces.com/api/plan/v3"
          />
        </label>
        <label>
          API Key
          <input name="apiKey" type="password" required placeholder="ark-..." />
        </label>
        <label>
          默认文本模型
          <input name="modelName" required list="volc-models" placeholder="doubao-seed-2.0-mini" defaultValue="doubao-seed-2.0-mini" />
          <datalist id="volc-models">
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </datalist>
        </label>
        <button type="submit" className="btn-primary">
          添加供应商
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>名称</th>
            <th>类型</th>
            <th>模型</th>
            <th>密钥</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.providerType}</td>
              <td>{p.modelName}</td>
              <td>{p.keyEncrypted ? "已加密" : "旧明文（请删除后重建）"}</td>
              <td>{p.isActive ? "活跃" : "停用"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
