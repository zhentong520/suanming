"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin/client";

interface AdminInsights {
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

interface ReportPayload {
  id: string;
  moduleName: string;
  account: string;
  profileName: string | null;
  createdAt: string;
  templateReport: string;
  aiReport: string | null;
  adminInsights: AdminInsights | null;
  hasAdminInsights: boolean;
}

export default function AdminReportPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [data, setData] = useState<ReportPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminFetch(`/api/admin/reports/${id}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "加载失败");
        setData(j);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-container">加载中…</div>;
  if (error) return <div className="page-container" style={{ color: "crimson" }}>{error}</div>;
  if (!data) return <div className="page-container">无数据</div>;

  const ai = data.adminInsights;

  return (
    <div className="page-container" style={{ maxWidth: 960 }}>
      <p>
        <Link href="/admin/operations">← 操作记录</Link>
      </p>
      <h1 style={{ color: "var(--gold)" }}>报告洞察（仅管理员）</h1>
      <p style={{ opacity: 0.85 }}>
        {data.moduleName} · {data.account} · {data.profileName ?? "无档案"} ·{" "}
        {new Date(data.createdAt).toLocaleString("zh-CN")}
      </p>

      {!ai ? (
        <div className="card" style={{ marginTop: "1rem", padding: "1rem" }}>
          <p>本报告无 adminInsights（非八字/大运/面相手相，或旧数据未重算）。</p>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginTop: "1rem", padding: "1rem", borderLeft: "3px solid #c45" }}>
            <strong>内部免责</strong>
            <p>{ai.disclaimer}</p>
          </div>

          <h2 style={{ marginTop: "1.5rem" }}>行业倾向</h2>
          <div className="card" style={{ padding: "1rem" }}>
            <p>{ai.careerHint.note}</p>
            <p>
              <strong>方向：</strong>
              {ai.careerHint.industries.join("、") || "—"}
            </p>
            <p style={{ opacity: 0.8 }}>{ai.careerHint.currentLikelihoodNote}</p>
            <p style={{ fontSize: 13, opacity: 0.7 }}>依据：{ai.careerHint.basis}</p>
          </div>

          <h2 style={{ marginTop: "1.5rem" }}>六亲时间线</h2>
          <div className="card" style={{ padding: "1rem" }}>
            {ai.liuqin.map((q) => (
              <div key={q.relation} style={{ marginBottom: "0.75rem" }}>
                <strong>
                  {q.relation}（{q.ageRange}）
                </strong>
                <p style={{ margin: "0.25rem 0" }}>{q.note}</p>
                <p style={{ fontSize: 12, opacity: 0.65 }}>依据：{q.basis}</p>
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: "1.5rem" }}>流年/大运事件倾向</h2>
          <div className="card" style={{ padding: "1rem", overflowX: "auto" }}>
            {ai.timeline.length === 0 ? (
              <p>暂无大运流年列表（请用「八字大运」模块重算以生成流年表）。</p>
            ) : (
              <table style={{ width: "100%", fontSize: 14 }}>
                <thead>
                  <tr>
                    <th>时段</th>
                    <th>干支</th>
                    <th>倾向</th>
                    <th>类别</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  {ai.timeline.map((t, i) => (
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
            )}
          </div>
        </>
      )}

      <h2 style={{ marginTop: "1.5rem" }}>客户可见模板报告（对照）</h2>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "rgba(0,0,0,0.04)",
          padding: "1rem",
          borderRadius: 8,
          fontSize: 13,
        }}
      >
        {data.templateReport}
      </pre>
    </div>
  );
}
