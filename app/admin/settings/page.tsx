"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface SecurityHints {
  jwtConfigured: boolean;
  jwtLooksWeak: boolean;
  adminEnvPasswordIsDefault: boolean;
  siteUrl: string;
  databaseUrl: string;
  dialect: string;
}

export default function SettingsAdminPage() {
  const [username, setUsername] = useState("admin");
  const [security, setSecurity] = useState<SecurityHints | null>(null);
  const [aiInfo, setAiInfo] = useState<{
    userQuota: number;
    volcConfigured: boolean;
    textModel: string;
    visionModel: string;
    baseUrl: string;
  } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "加载失败");
        setUsername(data.username ?? "admin");
        setSecurity(data.security ?? null);
        setAiInfo(data.ai ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "修改失败");
      setMessage(data.message ?? "已更新");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>加载中…</div>;

  return (
    <div>
      <h1>系统设置</h1>

      <section className="form-grid" style={{ maxWidth: 560, marginTop: "1rem" }}>
        <h2 style={{ margin: 0 }}>运行环境</h2>
        <label>
          数据库
          <input readOnly value={security?.databaseUrl ?? ""} />
        </label>
        <label>
          方言
          <input readOnly value={security?.dialect ?? "sqlite"} />
        </label>
        <label>
          站点 URL
          <input readOnly value={security?.siteUrl || "（未配置 NEXT_PUBLIC_SITE_URL）"} />
        </label>
        <p style={{ color: "#666", fontSize: "0.9rem" }}>
          切换 Postgres/MySQL：设置 DATABASE_DIALECT 与 DATABASE_URL（当前版本仍以 SQLite 为主）。
        </p>
      </section>

      <section style={{ maxWidth: 560, marginTop: "2rem" }}>
        <h2>安全提示</h2>
        <ul style={{ lineHeight: 1.9, color: "#444" }}>
          <li>
            JWT_SECRET：
            {security?.jwtLooksWeak ? (
              <strong style={{ color: "#b83a2f" }}> 偏弱或仍为占位值，生产环境请在 .env.local 中更换为长随机串</strong>
            ) : (
              <span style={{ color: "#3d5a4c" }}> 已配置且长度合格</span>
            )}
          </li>
          <li>
            ADMIN_PASSWORD 环境变量：
            {security?.adminEnvPasswordIsDefault ? (
              <strong style={{ color: "#b83a2f" }}> 仍为默认 admin123（仅影响首次 seed；改密请用下方表单）</strong>
            ) : (
              <span> 已自定义</span>
            )}
          </li>
          <li>当前登录账号：{username}</li>
        </ul>
      </section>

      <section style={{ maxWidth: 560, marginTop: "2rem" }}>
        <h2>AI 配额（火山 Token Plan）</h2>
        <ul style={{ lineHeight: 1.9, color: "#444" }}>
          <li>火山已配置：{aiInfo?.volcConfigured ? "是" : "否（检查 VOLC_ARK_API_KEY）"}</li>
          <li>Base URL：{aiInfo?.baseUrl ?? "—"}</li>
          <li>文本模型：{aiInfo?.textModel ?? "—"}</li>
          <li>识图模型：{aiInfo?.visionModel ?? "—"}</li>
          <li>普通用户额度：每人 {aiInfo?.userQuota ?? 2} 次（含文本解读与识图）</li>
          <li>前台 role=admin 或 AI_UNLIMITED_EMAILS 中的邮箱：无限次</li>
        </ul>
        <form
          className="form-grid"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setMessage("");
            const res = await adminFetch("/api/admin/settings", {
              method: "PUT",
              body: JSON.stringify({ action: "grant-ai-admin", email: grantEmail }),
            });
            const data = await res.json();
            if (!res.ok) setError(data.error ?? "失败");
            else {
              setMessage(data.message);
              setGrantEmail("");
            }
          }}
        >
          <label>
            授予前台账号 AI 无限（邮箱）
            <input
              type="email"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </label>
          <button type="submit" className="btn-primary" style={{ width: "auto" }}>
            设为管理员角色
          </button>
        </form>
      </section>

      <section style={{ maxWidth: 560, marginTop: "2rem" }}>
        <h2>修改管理员密码</h2>
        <form onSubmit={handleChangePassword} className="form-grid">
          <label>
            当前密码
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label>
            新密码（至少 8 位）
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label>
            确认新密码
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={saving} style={{ width: "auto" }}>
            {saving ? "提交中…" : "更新密码"}
          </button>
        </form>
        {error && <p style={{ color: "#b83a2f" }}>{error}</p>}
        {message && (
          <p style={{ color: "#3d5a4c" }}>
            {message}{" "}
            <a href="/admin/login" style={{ color: "#b83a2f" }}>
              去重新登录
            </a>
          </p>
        )}
      </section>
    </div>
  );
}
