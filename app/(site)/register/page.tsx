"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollCard } from "@/components/site/Guofeng";
import { useLocale } from "@/components/site/LocaleProvider";

export default function RegisterPage() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    if (!email && !phone) {
      setError(t("auth.needEmailOrPhone"));
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          password: fd.get("password"),
          displayName: fd.get("displayName") || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("auth.registerFailed"));
      window.location.assign("/profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registerFailed"));
      setLoading(false);
    }
  }

  return (
    <div className="page-container auth-page">
      <header className="page-header">
        <p className="page-eyebrow">{t("auth.registerEyebrow")}</p>
        <h1>{t("auth.registerTitle")}</h1>
        <p className="page-desc">{t("auth.registerDesc")}</p>
      </header>
      <ScrollCard title={t("auth.registerCard")}>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            {t("auth.displayName")}
            <input name="displayName" placeholder={t("auth.displayName")} />
          </label>
          <label>
            {t("auth.email")}
            <input name="email" type="email" placeholder="you@email.com" />
          </label>
          <label>
            {t("auth.phone")}
            <input name="phone" type="tel" placeholder="11-digit mobile" />
          </label>
          <label>
            {t("auth.password")}
            <input name="password" type="password" required minLength={6} placeholder={t("auth.passwordHint")} />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t("auth.registering") : t("auth.registerBtn")}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <p className="auth-switch">
          {t("auth.hasAccount")}
          <Link href="/login">{t("auth.goLogin")}</Link>
        </p>
      </ScrollCard>
    </div>
  );
}
