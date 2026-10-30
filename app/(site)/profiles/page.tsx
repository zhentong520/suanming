"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CitySelect } from "@/components/site/CitySelect";
import { ScrollCard, SealBadge, SectionHeading } from "@/components/site/Guofeng";
import { useUser } from "@/components/site/UserProvider";
import { useLocale } from "@/components/site/LocaleProvider";
import { getModuleName } from "@/lib/hub/module-i18n";
import type { ChinaCity } from "@/lib/geo/china-cities";

function formatProfileSummary(p: {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number | null;
}) {
  const time = p.birthHour != null ? ` ${p.birthHour}时` : "";
  return `${p.birthYear}年${p.birthMonth}月${p.birthDay}日${time}`;
}

interface ReportItem {
  id: string;
  moduleId: string;
  moduleName: string;
  profileName: string | null;
  hasAi: boolean;
  snippet: string;
  createdAt: string;
}

export default function ProfilesPage() {
  const { user, profiles, activeProfile, points, refresh, setActiveProfile, loading } = useUser();
  const { t, locale } = useLocale();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [birthLocation, setBirthLocation] = useState("");
  const [birthLongitude, setBirthLongitude] = useState("");
  const [birthLatitude, setBirthLatitude] = useState("");
  const [birthYear, setBirthYear] = useState("1990");
  const [cityKey, setCityKey] = useState(0);
  const showDstHint = Number(birthYear) >= 1986 && Number(birthYear) <= 1991;

  function applyCity(city: ChinaCity | null) {
    if (!city) {
      setBirthLocation("");
      setBirthLongitude("");
      setBirthLatitude("");
      return;
    }
    setBirthLocation(city.name);
    setBirthLongitude(String(city.lon));
    setBirthLatitude(String(city.lat));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reports", { credentials: "include" });
        const data = await res.json();
        if (!cancelled && res.ok) setReports((data.reports ?? []).slice(0, 10));
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setReportsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profiles.length]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setCreating(true);
    setError("");
    const fd = new FormData(form);
    try {
      await fetch("/api/init", { credentials: "include" });
      const res = await fetch("/api/profiles", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          gender: fd.get("gender"),
          calendarType: fd.get("calendarType"),
          birthYear: fd.get("birthYear"),
          birthMonth: fd.get("birthMonth"),
          birthDay: fd.get("birthDay"),
          birthHour: fd.get("birthHour") || null,
          birthMinute: fd.get("birthMinute") || 0,
          birthLocation: birthLocation || null,
          birthLongitude: birthLongitude || null,
          birthLatitude: birthLatitude || null,
          ziSect: fd.get("ziSect") === "1" ? 1 : 2,
          setAsActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "创建失败");
      form.reset();
      setBirthLocation("");
      setBirthLongitude("");
      setBirthLatitude("");
      setCityKey((k) => k + 1);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  }

  async function handleActivate(profileId: string) {
    await setActiveProfile(profileId);
  }

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ textAlign: "center", padding: "3rem" }}>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <p className="page-eyebrow">{t("profiles.eyebrow")}</p>
        <h1>{t("profiles.title")}</h1>
        <p className="page-desc">
          {user?.displayName || user?.email || user?.phone} · {t("profiles.desc")}
        </p>
        {points && (
          <p className="page-desc" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            {points.unlimited
              ? t("profiles.pointsUnlimited")
              : t("profiles.pointsBalance", { balance: points.balance })}
            {" · "}
            <Link href="/recharge">{t("nav.recharge")}</Link>
            {" · "}
            <Link href="/reports">{t("profiles.allReports")}</Link>
          </p>
        )}
      </header>

      <ScrollCard title={t("profiles.newTitle")} variant="hero">
        <form onSubmit={handleCreate} className="form-grid">
          <label>
            {t("profiles.name")}
            <input name="name" placeholder={t("profiles.namePh")} required />
          </label>
          <label>
            {t("profiles.gender")}
            <select name="gender" defaultValue="男">
              <option value="男">{t("profiles.male")}</option>
              <option value="女">{t("profiles.female")}</option>
            </select>
          </label>
          <label>
            {t("profiles.calendar")}
            <select name="calendarType" defaultValue="solar">
              <option value="solar">{t("profiles.solar")}</option>
              <option value="lunar">{t("profiles.lunar")}</option>
            </select>
          </label>
          <label>
            {t("profiles.year")}
            <input
              name="birthYear"
              type="number"
              required
              defaultValue={1990}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
          </label>
          <label>
            {t("profiles.month")}
            <input name="birthMonth" type="number" min={1} max={12} required defaultValue={5} />
          </label>
          <label>
            {t("profiles.day")}
            <input name="birthDay" type="number" min={1} max={31} required defaultValue={15} />
          </label>
          <label>
            {t("profiles.hour")}
            <input name="birthHour" type="number" min={0} max={23} placeholder="15" />
          </label>
          <label>
            {t("profiles.minute")}
            <input name="birthMinute" type="number" min={0} max={59} defaultValue={0} />
          </label>
          <label>
            {t("profiles.city")}
            <CitySelect
              key={cityKey}
              placeholder={t("profiles.citySearch")}
              emptyHint={t("profiles.cityEmpty")}
              clearLabel={t("profiles.cityClear")}
              onSelect={applyCity}
            />
          </label>
          <label>
            {t("profiles.lon")}
            <input
              name="birthLongitude"
              type="number"
              step="0.1"
              placeholder="121.5"
              value={birthLongitude}
              onChange={(e) => setBirthLongitude(e.target.value)}
            />
          </label>
          <label>
            {t("profiles.lat")}
            <input
              name="birthLatitude"
              type="number"
              step="0.1"
              placeholder="31.2"
              value={birthLatitude}
              onChange={(e) => setBirthLatitude(e.target.value)}
            />
          </label>
          <label>
            晚子时流派
            <select name="ziSect" defaultValue="2">
              <option value="2">算当天（传统通行）</option>
              <option value="1">算次日（换日派）</option>
            </select>
          </label>
          {showDstHint && (
            <p className="form-hint" style={{ gridColumn: "1 / -1" }}>
              ℹ️ 1986–1991 年中国实行夏令时：系统会自动把出生钟表时间回拨 1 小时再排盘，若出生时段恰逢夏令时起止，请在报告中核对校正说明。
            </p>
          )}
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? t("profiles.saving") : t("profiles.save")}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
      </ScrollCard>

      <section className="home-modules">
        <SectionHeading title={t("profiles.listTitle")} subtitle={t("profiles.listSubtitle")} />
        {profiles.length === 0 ? (
          <p className="empty-hint">{t("profiles.empty")}</p>
        ) : (
          <div className="profile-list">
            {profiles.map((p) => (
              <div key={p.id} className={`profile-card ${activeProfile?.id === p.id ? "profile-card--active" : ""}`}>
                <div className="profile-card-head">
                  <strong>{p.name ?? "—"}</strong>
                  {activeProfile?.id === p.id && <SealBadge variant="gold">{t("profiles.current")}</SealBadge>}
                </div>
                <p className="profile-card-meta">{formatProfileSummary(p)}</p>
                <div className="profile-card-actions">
                  {activeProfile?.id !== p.id && (
                    <button type="button" className="btn-ghost btn-sm" onClick={() => handleActivate(p.id)}>
                      {t("profiles.setCurrent")}
                    </button>
                  )}
                  <Link href={`/profile/${p.id}`} className="btn-ghost btn-sm">
                    {t("profiles.view")}
                  </Link>
                  <Link href={`/profile/${p.id}`} className="btn-primary btn-sm">
                    {t("profiles.start")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="home-modules">
        <SectionHeading
          title={t("profiles.reportsTitle")}
          subtitle={
            reportsLoading
              ? t("common.loading")
              : t("profiles.reportsSubtitle", { count: reports.length })
          }
        />
        {reports.length === 0 && !reportsLoading ? (
          <ScrollCard title={t("profiles.noReports")}>
            <p className="page-desc">{t("profiles.noReportsDesc")}</p>
            <Link href="/modules" className="btn-ghost btn-sm" style={{ marginTop: "0.75rem", display: "inline-block" }}>
              {t("profiles.goCalc")}
            </Link>
          </ScrollCard>
        ) : (
          <ul className="report-history-list">
            {reports.map((r) => (
              <li key={r.id}>
                <Link href={`/reports/${r.id}`} className="report-history-card">
                  <div className="report-history-meta">
                    <SealBadge variant="gold">{getModuleName(r.moduleId, locale, r.moduleName)}</SealBadge>
                    {r.hasAi && <SealBadge variant="red">AI</SealBadge>}
                    <time dateTime={r.createdAt}>
                      {new Date(r.createdAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN")}
                    </time>
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
        <p className="page-desc" style={{ marginTop: "0.75rem" }}>
          <Link href="/reports">{t("profiles.viewAllReports")}</Link>
        </p>
      </section>
    </div>
  );
}
