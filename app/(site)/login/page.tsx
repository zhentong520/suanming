"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ScrollCard } from "@/components/site/Guofeng";
import { useLocale } from "@/components/site/LocaleProvider";

function safeNextPath(from: string | null, fallback: string) {
  if (!from || !from.startsWith("/") || from.startsWith("//")) return fallback;
  if (from === "/login" || from === "/register") return fallback;
  // 勿把 PWA/静态资源当成回跳目标（曾导致无限刷新）
  if (
    from.startsWith("/manifest") ||
    from.startsWith("/sw.js") ||
    from.startsWith("/icons/") ||
    from.includes(".")
  ) {
    return fallback;
  }
  return from;
}

function LoginForm() {
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: fd.get("account"),
          password: fd.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("auth.loginFailed"));
      const fallback = data.user?.activeProfileId ? "/" : "/profiles";
      const next = safeNextPath(searchParams.get("from"), fallback);
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          {t("auth.account")}
          <input name="account" required placeholder="you@email.com / 13800138000" />
        </label>
        <label>
          {t("auth.password")}
          <input name="password" type="password" required minLength={6} placeholder={t("auth.passwordHint")} />
        </label>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t("auth.loggingIn") : t("auth.loginBtn")}
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <p className="auth-switch">
        {t("auth.noAccount")}
        <Link href="/register">{t("auth.registerNow")}</Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  const { t } = useLocale();
  return (
    <div className="page-container auth-page">
      <header className="page-header">
        <p className="page-eyebrow">{t("auth.loginEyebrow")}</p>
        <h1>{t("auth.loginTitle")}</h1>
        <p className="page-desc">{t("auth.loginDesc")}</p>
      </header>
      <ScrollCard title={t("auth.loginCard")}>
        <Suspense fallback={<p>{t("common.loading")}</p>}>
          <LoginForm />
        </Suspense>
      </ScrollCard>
    </div>
  );
}
