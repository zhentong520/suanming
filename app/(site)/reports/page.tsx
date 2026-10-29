"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollCard, SectionHeading, SealBadge } from "@/components/site/Guofeng";
import { useLocale } from "@/components/site/LocaleProvider";
import { getModuleName } from "@/lib/hub/module-i18n";

interface ReportItem {
  id: string;
  moduleId: string;
  moduleName: string;
  profileName: string | null;
  hasAi: boolean;
  snippet: string;
  createdAt: string;
}

export default function ReportsPage() {
  const { locale, t } = useLocale();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reports", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? t("common.error"));
        if (!cancelled) setReports(data.reports ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t("common.error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow">{t("reports.eyebrow")}</p>
        <h1>{t("reports.title")}</h1>
        <p className="page-desc">{t("reports.desc")}</p>
        <div className="page-header-line" aria-hidden />
      </header>

      <section className="home-modules">
        <SectionHeading
          title={t("reports.all")}
          subtitle={loading ? t("common.loading") : `${reports.length}`}
        />
        {error && <p className="form-error">{error}</p>}
        {!loading && !error && reports.length === 0 && (
          <ScrollCard title={t("reports.empty")}>
            <p className="page-desc">{t("reports.emptyDesc")}</p>
            <Link href="/modules" className="btn-primary" style={{ display: "inline-block", marginTop: "1rem" }}>
              {t("profiles.goCalc")}
            </Link>
          </ScrollCard>
        )}
        {reports.length > 0 && (
          <ul className="report-history-list">
            {reports.map((r) => (
              <li key={r.id}>
                <Link href={`/reports/${r.id}`} className="report-history-card">
                  <div className="report-history-meta">
                    <SealBadge variant="gold">{getModuleName(r.moduleId, locale, r.moduleName)}</SealBadge>
                    {r.hasAi && <SealBadge variant="red">AI</SealBadge>}
                    <time dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}</time>
                  </div>
                  <p className="report-history-profile">
                    {r.profileName
                      ? t("reports.profile", { name: r.profileName })
                      : t("reports.noProfile")}
                  </p>
                  <p className="report-history-snippet">{r.snippet || t("reports.snippet")}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
