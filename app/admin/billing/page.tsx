"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface BillingSettings {
  billingEnabled: boolean;
  costCalc: number;
  costAi: number;
  costVision: number;
  costLifeInsights: number;
  registerBonus: number;
  yuanToPoints: number;
}

export default function AdminBillingPage() {
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/billing");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "加载失败");
        setSettings(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await adminFetch("/api/admin/billing", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setSettings(data.settings);
      setMessage("计费设置已保存");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>加载中…</p>;
  if (!settings) return <p style={{ color: "#b83a2f" }}>{error || "无法加载设置"}</p>;

  return (
    <div>
      <h1>计费设置</h1>
      <p style={{ color: "#666", margin: "0.5rem 0 1rem" }}>
        收费总开关与扣费档位。关闭「启用积分收费」后，所有用户测算默认扣
        <strong> 0 </strong>
        积分、不收费。前台管理员（role=admin）始终不扣积分，且可使用已关闭模块、不受限流与停用约束。
      </p>

      <form onSubmit={save} className="form-grid" style={{ maxWidth: 480 }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={settings.billingEnabled}
            onChange={(e) => setSettings({ ...settings, billingEnabled: e.target.checked })}
          />
          启用积分收费
        </label>

        <label>
          普通测算（积分）
          <input
            type="number"
            min={0}
            value={settings.costCalc}
            onChange={(e) => setSettings({ ...settings, costCalc: Number(e.target.value) })}
          />
        </label>
        <label>
          AI 解读（积分）
          <input
            type="number"
            min={0}
            value={settings.costAi}
            onChange={(e) => setSettings({ ...settings, costAi: Number(e.target.value) })}
          />
        </label>
        <label>
          视觉 AI / 面相手相（积分）
          <input
            type="number"
            min={0}
            value={settings.costVision}
            onChange={(e) => setSettings({ ...settings, costVision: Number(e.target.value) })}
          />
        </label>
        <label>
          人生洞察解锁（流年倾向 + 六亲时间线）（积分）
          <input
            type="number"
            min={0}
            value={settings.costLifeInsights ?? 30}
            onChange={(e) => setSettings({ ...settings, costLifeInsights: Number(e.target.value) })}
          />
        </label>
        <p style={{ fontSize: "0.85rem", color: "#888", margin: "-0.35rem 0 0.5rem" }}>
          仅当用户在「用户管理」中被允许查看人生洞察时，可在报告页扣积分解锁。默认 30。
        </p>
        <label>
          新用户注册赠送
          <input
            type="number"
            min={0}
            value={settings.registerBonus}
            onChange={(e) => setSettings({ ...settings, registerBonus: Number(e.target.value) })}
          />
        </label>
        <label>
          充值汇率（1 元兑换积分）
          <input
            type="number"
            min={1}
            value={settings.yuanToPoints}
            onChange={(e) => setSettings({ ...settings, yuanToPoints: Number(e.target.value) })}
          />
        </label>
        <p style={{ fontSize: "0.85rem", color: "#888" }}>
          微信 / 支付宝正式支付后续对接；当前可通过「用户管理」赠送积分。
        </p>

        {error && <p style={{ color: "#b83a2f" }}>{error}</p>}
        {message && <p style={{ color: "#2f6b3a" }}>{message}</p>}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "保存中…" : "保存设置"}
        </button>
      </form>
    </div>
  );
}
