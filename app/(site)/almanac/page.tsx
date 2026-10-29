import Link from "next/link";
import { Suspense } from "react";
import { ScrollCard, SealBadge, SectionHeading } from "@/components/site/Guofeng";
import { AlmanacQueryForm } from "@/components/site/AlmanacQueryForm";
import { getAlmanacForDate } from "@/lib/engine/calendar";
import { computeAlmanac } from "@/lib/engine/almanac";

function formatAlmanacFacts(facts: ReturnType<typeof computeAlmanac>) {
  return {
    date: facts.date,
    lunarDate: facts.lunarDate,
    yi: facts.yi,
    ji: facts.ji,
    chong: facts.chong,
    sha: facts.sha,
    wuXing: facts.wuXing,
    pengZu: facts.pengZu,
    shengXiao: facts.shengXiao,
    jiShen: facts.jiShen,
    xiongSha: facts.xiongSha,
    recommendation: facts.recommendation,
    avoid: facts.avoid,
    personalHint: facts.personalHint,
    jiuXing: facts.jiuXing,
  };
}

function AlmanacDisplay({
  facts,
  title = "今日黄历",
}: {
  facts: ReturnType<typeof formatAlmanacFacts>;
  title?: string;
}) {
  return (
    <ScrollCard title={title} variant="hero">
      <div className="almanac-card almanac-card--full">
        <div className="almanac-date">
          <SealBadge variant="gold">{facts.lunarDate}</SealBadge>
          <span className="almanac-ganzhi">
            公历 {facts.date} · {facts.shengXiao}日 · 纳音 {facts.wuXing}
          </span>
        </div>

        <div className="almanac-row almanac-row--yi">
          <span className="almanac-label">宜</span>
          <span>{facts.yi.join(" · ") || "—"}</span>
        </div>
        <div className="almanac-row almanac-row--ji">
          <span className="almanac-label">忌</span>
          <span>{facts.ji.join(" · ") || "—"}</span>
        </div>

        <div className="almanac-detail-grid">
          <div>
            <strong>冲煞</strong>
            <p>{facts.chong}</p>
          </div>
          <div>
            <strong>煞方</strong>
            <p>{facts.sha}</p>
          </div>
          <div>
            <strong>彭祖百忌</strong>
            <p>{facts.pengZu}</p>
          </div>
          {facts.jiuXing && (
            <div>
              <strong>日九星</strong>
              <p>
                {facts.jiuXing.name} · {facts.jiuXing.nature} · {facts.jiuXing.tip}
              </p>
            </div>
          )}
        </div>

        {facts.jiShen?.length > 0 && (
          <p className="almanac-extra">
            <strong>吉神：</strong>
            {facts.jiShen.join("、")}
          </p>
        )}
        {facts.xiongSha?.length > 0 && (
          <p className="almanac-extra">
            <strong>凶煞：</strong>
            {facts.xiongSha.join("、")}
          </p>
        )}
        {facts.personalHint && (
          <p className="almanac-personal">{facts.personalHint}</p>
        )}
      </div>
    </ScrollCard>
  );
}

export default async function AlmanacPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; profileId?: string }>;
}) {
  const params = await searchParams;
  const todayFacts = formatAlmanacFacts(computeAlmanac());

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow">日用术数</p>
        <h1>黄历择日</h1>
        <p className="page-desc">观天时宜忌，择吉而行</p>
        <div className="page-header-line" aria-hidden />
      </header>

      <AlmanacDisplay facts={todayFacts} />

      <section className="home-modules" style={{ marginTop: "2rem" }}>
        <SectionHeading title="查询其他日期" subtitle="选择日期后查看该日宜忌" />
        <ScrollCard title="日期查询">
          <Suspense fallback={<p>加载中…</p>}>
            <AlmanacQueryForm initialDate={params.date} profileId={params.profileId} />
          </Suspense>
        </ScrollCard>
      </section>

      <p className="almanac-back">
        <Link href="/">← 返回首页</Link>
      </p>
    </div>
  );
}
