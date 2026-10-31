"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ReportPanel, ScrollCard, type PillarGridFacts } from "@/components/site/Guofeng";
import { SharePanel } from "@/components/site/SharePanel";
import { ReportAskPanel } from "@/components/site/ReportAskPanel";

interface LifeInsights {
  disclaimer: string;
  timeline: Array<{
    year: number;
    age?: number;
    period: string;
    ganZhi: string;
    categories: string[];
    tendency: string;
    note: string;
    basis: string;
  }>;
  liuqin: Array<{ relation: string; ageRange: string; note: string; basis: string }>;
  careerHint: {
    industries: string[];
    currentJobDetectable: boolean;
    currentLikelihoodNote: string;
    note: string;
    basis: string;
  };
}

interface LifeInsightsMeta {
  available: boolean;
  unlocked: boolean;
  canUnlock: boolean;
  allowLifeInsights: boolean;
  unlockCost: number;
  billingEnabled: boolean;
}

interface ReportDetail {
  id: string;
  moduleId: string;
  moduleName: string;
  modulePath: string;
  profileName: string | null;
  templateReport: string;
  aiReport?: string;
  facts?: PillarGridFacts | null;
  createdAt: string;
  lifeInsights?: LifeInsights;
  lifeInsightsMeta?: LifeInsightsMeta;
}

export default function ReportDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockMsg, setUnlockMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reports/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "加载失败");
        if (!cancelled) setReport(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function unlockInsights() {
    if (!report) return;
    setUnlocking(true);
    setUnlockMsg("");
    setError("");
    try {
      const res = await fetch(`/api/reports/${id}/unlock-insights`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "解锁失败");
      setReport((prev) =>
        prev
          ? {
              ...prev,
              lifeInsights: data.lifeInsights,
              lifeInsightsMeta: prev.lifeInsightsMeta
                ? {
                    ...prev.lifeInsightsMeta,
                    unlocked: true,
                    canUnlock: false,
                  }
                : prev.lifeInsightsMeta,
            }
          : prev
      );
      setUnlockMsg(
        data.alreadyUnlocked
          ? "已解锁"
          : data.spent > 0
            ? `已扣 ${data.spent} 积分解锁人生洞察`
            : "已解锁人生洞察"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "解锁失败");
    } finally {
      setUnlocking(false);
    }
  }

  const meta = report?.lifeInsightsMeta;
  const insights = report?.lifeInsights;

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow">
          <Link href="/reports">← 测算历史</Link>
        </p>
        <h1>{report?.moduleName ?? "测算报告"}</h1>
        {report && (
          <p className="page-desc">
            {new Date(report.createdAt).toLocaleString("zh-CN")}
            {report.profileName ? ` · ${report.profileName}` : ""}
          </p>
        )}
        <div className="page-header-line" aria-hidden />
      </header>

      {loading && <p className="page-desc">加载中…</p>}
      {error && <p className="form-error">{error}</p>}
      {unlockMsg && <p className="page-desc" style={{ color: "var(--ink-muted, #2f6b3a)" }}>{unlockMsg}</p>}

      {report && (
        <ScrollCard title="测算结果" variant="report">
          <div className="report-detail-actions">
            <Link href={report.modulePath} className="btn-ghost btn-sm">
              再次测算
            </Link>
          </div>
          <ReportPanel report={report.templateReport} aiReport={report.aiReport} facts={report.facts ?? null} />
          <ReportAskPanel reportId={report.id} />
          <SharePanel report={report.templateReport} moduleTitle={report.moduleName} />
        </ScrollCard>
      )}

      {report && meta?.available && (
        <div id="insights">
        <ScrollCard title="人生洞察（流年倾向 · 六亲时间线）" variant="report">
          {!meta.unlocked && (
            <div style={{ marginBottom: "1rem" }}>
              <p className="page-desc" style={{ marginBottom: "0.75rem" }}>
                含流年事件倾向、六亲时间线与行业方向象征。文化娱乐参考，非事实预言。
                {!meta.allowLifeInsights
                  ? " 当前账号尚未获管理员开放此功能。"
                  : meta.billingEnabled
                    ? ` 解锁需 ${meta.unlockCost} 积分。`
                    : " 当前未启用积分收费，可直接解锁。"}
              </p>
              {meta.canUnlock ? (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={unlocking}
                  onClick={() => void unlockInsights()}
                >
                  {unlocking ? "解锁中…" : `解锁人生洞察${meta.billingEnabled ? `（${meta.unlockCost} 积分）` : ""}`}
                </button>
              ) : !meta.allowLifeInsights ? (
                <p className="form-error">请联系管理员在用户管理中开启「人生洞察」权限。</p>
              ) : null}
            </div>
          )}

          {insights && (
            <div className="life-insights">
              <p className="page-desc" style={{ marginBottom: "1rem" }}>
                {insights.disclaimer}
              </p>

              <h3 style={{ margin: "1rem 0 0.5rem" }}>行业倾向</h3>
              <p>{insights.careerHint.note}</p>
              <p>
                方向：{insights.careerHint.industries.join("、") || "—"}
              </p>
              <p className="page-desc">{insights.careerHint.currentLikelihoodNote}</p>

              <h3 style={{ margin: "1.25rem 0 0.5rem" }}>六亲时间线</h3>
              {insights.liuqin.map((q) => (
                <div key={q.relation} style={{ marginBottom: "0.75rem" }}>
                  <strong>
                    {q.relation}（{q.ageRange}）
                  </strong>
                  <p style={{ margin: "0.25rem 0" }}>{q.note}</p>
                </div>
              ))}

              <h3 style={{ margin: "1.25rem 0 0.5rem" }}>流年 / 大运事件倾向</h3>
              {insights.timeline.length === 0 ? (
                <p className="page-desc">暂无流年表（八字大运模块或补全出生时辰后更完整）。</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: "0.9rem" }}>
                    <thead>
                      <tr>
                        <th align="left">时段</th>
                        <th align="left">干支</th>
                        <th align="left">倾向</th>
                        <th align="left">类别</th>
                        <th align="left">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {insights.timeline.map((t, i) => (
                        <tr key={`${t.period}-${i}`}>
                          <td>{t.period}</td>
                          <td>{t.ganZhi}</td>
                          <td>{t.tendency}</td>
                          <td>{t.categories.join("、")}</td>
                          <td>{t.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </ScrollCard>
        </div>
      )}
    </div>
  );
}
