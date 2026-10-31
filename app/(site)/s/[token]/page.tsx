import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSharedReport } from "@/lib/user/share";
import { ReportPanel } from "@/components/site/Guofeng";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const report = await getSharedReport(token).catch(() => null);
  return {
    title: report ? `${report.moduleName}测算结果 · 分享` : "分享链接已失效",
    robots: { index: false, follow: false },
  };
}

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const report = await getSharedReport(token).catch(() => null);
  if (!report) notFound();

  return (
    <div className="page-container shared-page">
      <header className="page-header">
        <p className="page-eyebrow">好友分享</p>
        <h1>{report.moduleName}测算结果</h1>
        <p className="page-desc">{new Date(report.createdAt).toLocaleString("zh-CN")}</p>
        <div className="page-header-line" aria-hidden />
      </header>

      <div className="scroll-card scroll-card--report">
        <div className="scroll-card-inner-pad">
          <ReportPanel report={report.templateReport} aiReport={report.aiReport ?? undefined} />
          <div className="shared-cta">
            <Link href="/" className="btn-primary">
              我也要测一测
            </Link>
          </div>
        </div>
      </div>

      <p className="shared-note">
        本页面由分享链接生成，仅展示该份测算结果；内容经合规处理，仅供文化娱乐参考，不构成任何专业建议。
      </p>
    </div>
  );
}
