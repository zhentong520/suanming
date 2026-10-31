"use client";

import { useState } from "react";
import Link from "next/link";
import { ScrollCard, ReportPanel, type PillarGridFacts } from "@/components/site/Guofeng";
import { SharePanel } from "@/components/site/SharePanel";
import { ReportAskPanel } from "@/components/site/ReportAskPanel";
import { useOptionalUser } from "@/components/site/UserProvider";
import { useLocale } from "@/components/site/LocaleProvider";

interface ModulePageProps {
  moduleId: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  requiresProfile?: boolean;
  profileId?: string | null;
  onSubmit: (params: Record<string, unknown>) => Promise<void>;
  loading: boolean;
  report: string;
  aiReport?: string;
  reportId?: string;
  facts?: PillarGridFacts | null;
  error: string;
}

export function ModulePageShell({
  title,
  description,
  children,
  onSubmit,
  loading,
  report,
  aiReport,
  reportId,
  facts,
  error,
  activeProfileName,
  requireLogin,
}: Omit<ModulePageProps, "moduleId" | "requiresProfile" | "profileId"> & {
  activeProfileName?: string;
  requireLogin?: boolean;
}) {
  const { t } = useLocale();
  const userCtx = useOptionalUser();
  const loggedIn = Boolean(userCtx?.user);

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow">{t("nav.modules")}</p>
        <h1>{title}</h1>
        <p className="page-desc">{description}</p>
        {activeProfileName && (
          <p className="page-desc" style={{ fontSize: "0.85rem", marginTop: "0.35rem" }}>
            {t("module.currentProfile")}
            {activeProfileName}
          </p>
        )}
        <div className="page-header-line" aria-hidden />
      </header>
      <ScrollCard title={t("common.submit")}>
        {requireLogin !== false && !loggedIn && !userCtx?.loading ? (
          <>
            <div className="module-steps">
              <span>① 登录 / 注册账号</span>
              <span>② 填写信息提交测算</span>
              <span>③ 生成报告 · AI 解读 · 追问</span>
            </div>
            <p className="form-error" style={{ marginBottom: "0.75rem" }}>
              {t("billing.loginRequired")}{" "}
              <Link href="/login">{t("nav.login")}</Link>
              {" · "}
              <Link href="/register">{t("nav.register")}</Link>
            </p>
          </>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (requireLogin !== false && !loggedIn) {
              window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
              return;
            }
            const fd = new FormData(e.currentTarget);
            const params: Record<string, unknown> = {};
            fd.forEach((v, k) => {
              params[k] = v;
            });
            onSubmit(params);
          }}
          className="form-grid"
        >
          {children}
          <div className="form-sticky-actions">
            <button type="submit" className="btn-primary" disabled={loading || (requireLogin !== false && !loggedIn)}>
              {loading ? (
                <span className="btn-loading">
                  <span className="btn-loading-dot" />
                  {t("common.submitting")}
                </span>
              ) : !loggedIn && requireLogin !== false ? (
                t("billing.loginToCalc")
              ) : (
                t("common.submit")
              )}
            </button>
          </div>
        </form>
        {error && (
          <p className="form-error">
            {error}
            {/积分不足/.test(error) ? (
              <>
                {" "}
                <Link href="/recharge">{t("billing.goRecharge")}</Link>
              </>
            ) : null}
          </p>
        )}
      </ScrollCard>
      {report && (
        <ScrollCard title={t("common.result")} variant="report" className="mt-6">
          {reportId && (
            <p className="report-saved-hint">
              {t("common.saved")} · <Link href={`/reports/${reportId}#insights`}>{t("common.viewDetail")}</Link>
              {" · "}
              <Link href="/reports">{t("common.allHistory")}</Link>
            </p>
          )}
          <ReportPanel report={report} aiReport={aiReport} facts={facts} />
          {reportId && <ReportAskPanel reportId={reportId} />}
          <SharePanel reportId={reportId} report={report} moduleTitle={title} />
        </ScrollCard>
      )}
    </div>
  );
}

export function useModuleCalc(moduleId: string, profileId?: string | null) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [aiReport, setAiReport] = useState<string | undefined>();
  const [reportId, setReportId] = useState<string | undefined>();
  const [facts, setFacts] = useState<PillarGridFacts | null>(null);
  const [error, setError] = useState("");
  const userCtx = useOptionalUser();
  const { locale, t } = useLocale();

  async function submit(params: Record<string, unknown>) {
    if (!userCtx?.user) {
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/${moduleId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ profileId, params: { ...params, locale } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("common.error"));
      setReport(data.templateReport);
      setAiReport(data.aiReport);
      setReportId(data.reportId);
      setFacts(data.facts ?? null);
      void userCtx?.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.calcFailed"));
    } finally {
      setLoading(false);
    }
  }

  return { loading, report, aiReport, reportId, facts, error, submit };
}
