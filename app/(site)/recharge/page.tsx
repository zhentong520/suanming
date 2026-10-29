"use client";

import Link from "next/link";
import { ScrollCard } from "@/components/site/Guofeng";
import { useOptionalUser } from "@/components/site/UserProvider";
import { useLocale } from "@/components/site/LocaleProvider";

export default function RechargePage() {
  const ctx = useOptionalUser();
  const { t } = useLocale();
  const points = ctx?.points;

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow">{t("nav.recharge")}</p>
        <h1>{t("recharge.title")}</h1>
        <p className="page-desc">{t("recharge.desc")}</p>
        <div className="page-header-line" aria-hidden />
      </header>

      <ScrollCard title={t("recharge.balanceTitle")}>
        {points?.unlimited ? (
          <p>{t("profiles.pointsUnlimited")}</p>
        ) : (
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            {t("profiles.pointsBalance", { balance: points?.balance ?? 0 })}
          </p>
        )}
        <p style={{ color: "var(--ink-muted, #666)", marginTop: "0.75rem" }}>
          {t("recharge.rateHint")}
        </p>
        <p style={{ color: "var(--ink-muted, #666)", marginTop: "0.5rem" }}>
          {t("recharge.costHint")}
        </p>
      </ScrollCard>

      <ScrollCard title={t("recharge.payTitle")} className="mt-6">
        <p>{t("recharge.paySoon")}</p>
        <ul style={{ margin: "0.75rem 0", paddingLeft: "1.25rem", lineHeight: 1.7 }}>
          <li>{t("recharge.wechat")}</li>
          <li>{t("recharge.alipay")}</li>
        </ul>
        <p style={{ color: "var(--ink-muted, #666)" }}>{t("recharge.contactOps")}</p>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/modules" className="btn-primary">
            {t("nav.modules")}
          </Link>
          <Link href="/profiles" className="site-nav-link">
            {t("nav.profiles")}
          </Link>
        </div>
      </ScrollCard>
    </div>
  );
}
