"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "登录失败");
      return;
    }
    // token 仅存 HttpOnly Cookie，不再写入 localStorage
    try {
      localStorage.removeItem("admin_token");
    } catch {
      /* ignore */
    }
    router.push("/admin/dashboard");
  }

  return (
    <div className="page-container" style={{ maxWidth: 400 }}>
      <h1 style={{ color: "var(--cinnabar)" }}>管理后台登录</h1>
      <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: "1.5rem" }}>
        <label>
          用户名
          <input name="username" defaultValue="admin" required />
        </label>
        <label>
          密码
          <input name="password" type="password" required />
        </label>
        <button type="submit" className="btn-primary">
          登录
        </button>
      </form>
      <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "1rem" }}>
        独立管理入口，与前台用户登录分离。会话使用 HttpOnly Cookie。
      </p>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
