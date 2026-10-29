"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

const NAV = [
  { href: "/admin/dashboard", label: "仪表盘" },
  { href: "/admin/operations", label: "操作记录" },
  { href: "/admin/users", label: "用户管理" },
  { href: "/admin/ledger", label: "积分流水" },
  { href: "/admin/billing", label: "计费设置" },
  { href: "/admin/modules", label: "模块管理" },
  { href: "/admin/ai-providers", label: "AI 模型配置" },
  { href: "/admin/ai-switches", label: "AI 开关" },
  { href: "/admin/content", label: "内容管理" },
  { href: "/admin/settings", label: "系统设置" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    adminFetch("/api/admin/auth")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) router.replace("/admin/login");
        else setReady(true);
      })
      .catch(() => router.replace("/admin/login"));
  }, [pathname, router]);

  async function logout() {
    await adminFetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready) return <div className="page-container">加载中…</div>;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2 style={{ marginBottom: "1rem", color: "var(--gold)" }}>管理后台</h2>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} style={{ fontWeight: pathname === n.href ? 700 : 400 }}>
            {n.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => void logout()}
          style={{ marginTop: "1.5rem", textAlign: "left", background: "none", border: 0, cursor: "pointer", opacity: 0.8 }}
        >
          退出登录
        </button>
        <Link href="/" style={{ marginTop: "0.75rem", opacity: 0.7 }}>
          ← 返回前台
        </Link>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
