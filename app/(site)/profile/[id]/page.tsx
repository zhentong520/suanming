import Link from "next/link";
import { redirect } from "next/navigation";
import { seedDatabase } from "@/lib/db/seed";
import { MODULE_DEFINITIONS } from "@/lib/hub/module-registry";
import { ScrollCard, FortuneGrid, SealBadge, SectionHeading } from "@/components/site/Guofeng";
import { computeCalendar } from "@/lib/engine/calendar";
import { getSessionFromCookies } from "@/lib/user/auth";
import { getProfileForUser } from "@/lib/user/profiles";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await seedDatabase();
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { id } = await params;
  const profile = await getProfileForUser(session.userId, id);
  if (!profile) {
    return (
      <div className="page-container">
        <p>档案不存在或无权访问</p>
        <Link href="/profiles">返回档案中心</Link>
      </div>
    );
  }

  const cal = computeCalendar({
    calendarType: profile.calendarType as "solar" | "lunar",
    year: profile.birthYear,
    month: profile.birthMonth,
    day: profile.birthDay,
    hour: profile.birthHour,
    gender: profile.gender,
  });

  const modules = MODULE_DEFINITIONS.filter((m) => m.implemented).map((m) => ({
    id: m.id,
    name: m.name,
    path: m.path,
    category: m.category,
    implemented: m.implemented,
  }));

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow">命理档案</p>
        <h1>{profile.name ?? "我的命理档案"}</h1>
        <p className="page-desc">
          {cal.solarDate} · 农历{cal.lunarDate} · {cal.shengXiao}
        </p>
        <div className="page-header-line" aria-hidden />
      </header>

      <ScrollCard title="命盘摘要" variant="hero">
        <div className="profile-summary">
          <div className="profile-pillar">
            <SealBadge>{cal.shengXiao}</SealBadge>
            <span className="profile-pillar-label">生肖</span>
          </div>
          <div className="profile-pillar">
            <span className="profile-pillar-value">{cal.ganZhiYear}</span>
            <span className="profile-pillar-label">年柱</span>
          </div>
          <div className="profile-pillar">
            <span className="profile-pillar-value">{cal.ganZhiMonth}</span>
            <span className="profile-pillar-label">月柱</span>
          </div>
          <div className="profile-pillar">
            <span className="profile-pillar-value">{cal.ganZhiDay}</span>
            <span className="profile-pillar-label">日柱</span>
          </div>
          <div className="profile-pillar">
            <span className="profile-pillar-value">{cal.ganZhiTime}</span>
            <span className="profile-pillar-label">时柱</span>
          </div>
        </div>
        <div className="profile-meta">
          <span>星座 {cal.constellation}</span>
          <span>纳音 {cal.naYin}</span>
          <span>五行 {cal.wuXing.join(" · ")}</span>
        </div>
        {session.activeProfileId !== id && (
          <p className="profile-warn">
            此档案不是当前档案。需要测算请先在
            <Link href="/profiles"> 档案中心 </Link>
            设为当前，或使用下方模块（将自动使用当前档案）。
          </p>
        )}
      </ScrollCard>

      <section className="home-modules">
        <SectionHeading title="可用测算" subtitle="使用当前选中的档案进行测算" />
        <FortuneGrid items={modules} />
      </section>

      <p className="almanac-back">
        <Link href="/profiles">← 返回档案中心</Link>
      </p>
    </div>
  );
}
