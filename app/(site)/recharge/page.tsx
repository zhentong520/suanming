"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScrollCard } from "@/components/site/Guofeng";
import { useOptionalUser } from "@/components/site/UserProvider";
import { useLocale } from "@/components/site/LocaleProvider";

interface RechargePackageView {
  id: string;
  label: string;
  priceYuan: number;
  points: number;
  bonusPoints: number;
}

export default function RechargePage() {
  const ctx = useOptionalUser();
  const { t } = useLocale();
  const points = ctx?.points;

  const [packages, setPackages] = useState<RechargePackageView[]>([]);
  const [alipayReady, setAlipayReady] = useState(false);
  const [buyingId, setBuyingId] = useState("");
  const [error, setError] = useState("");
  const [paidHint, setPaidHint] = useState(false);

  useEffect(() => {
    // 支付宝同步回跳带 ?paid=1：展示到账确认提示并刷新余额
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("paid")) {
      setPaidHint(true);
      void ctx?.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ctx?.user) return;
    (async () => {
      try {
        const res = await fetch("/api/pay/wechat/prepare");
        if (res.ok) {
          const data = await res.json();
          setPackages(data.packages ?? []);
        }
        const alipay = await fetch("/api/pay/alipay/prepare");
        if (alipay.ok) {
          const data = await alipay.json();
          setAlipayReady(!!data.alipayConfigured);
        }
      } catch {
        setError(t("recharge.loadFailed"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.user?.id]);

  async function buyWithAlipay(packageId: string) {
    setBuyingId(packageId);
    setError("");
    try {
      const res = await fetch("/api/pay/alipay/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("recharge.loadFailed"));
      // 跳转支付宝收银台；支付完成后经 return_url 回到本页
      window.location.href = data.redirectUrl as string;
    } catch (err) {
      setError((err as Error).message);
      setBuyingId("");
    }
  }

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
        {paidHint ? (
          <p style={{ color: "var(--jade, #3d5a4c)", marginTop: "0.5rem" }}>
            {t("recharge.paidPending")}
          </p>
        ) : null}
        <p style={{ color: "var(--ink-muted, #666)", marginTop: "0.75rem" }}>
          {t("recharge.rateHint")}
        </p>
      </ScrollCard>

      <ScrollCard title={t("recharge.packagesTitle")} className="mt-6">
        {packages.length ? (
          <ul className="recharge-pkg-list">
            {packages.map((p) => (
              <li key={p.id} className="recharge-pkg-item">
                <div className="recharge-pkg-info">
                  <span className="recharge-pkg-points">
                    {t("recharge.pointsUnit", { points: p.points })}
                  </span>
                  {p.bonusPoints > 0 ? (
                    <span className="recharge-pkg-bonus">
                      {t("recharge.bonus", { bonus: p.bonusPoints })}
                    </span>
                  ) : null}
                </div>
                <div className="recharge-pkg-actions">
                  {alipayReady ? (
                    <button
                      className="btn-primary btn-sm"
                      disabled={buyingId === p.id}
                      onClick={() => buyWithAlipay(p.id)}
                    >
                      {buyingId === p.id ? "…" : `¥${p.priceYuan} · ${t("recharge.buyAlipay")}`}
                    </button>
                  ) : (
                    <span style={{ color: "var(--ink-muted, #666)", fontSize: "0.85rem" }}>
                      ¥{p.priceYuan}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "var(--ink-muted, #666)" }}>{t("recharge.paySoon")}</p>
        )}
        {error ? (
          <p style={{ color: "var(--cinnabar, #a83228)", marginTop: "0.75rem" }}>{error}</p>
        ) : null}
        <p style={{ color: "var(--ink-muted, #666)", marginTop: "1rem" }}>
          {t("recharge.wechatMiniHint")}
        </p>
        {!ctx?.user ? (
          <div style={{ marginTop: "1rem" }}>
            <Link href="/login" className="btn-primary">
              {t("nav.login")}
            </Link>
          </div>
        ) : null}
      </ScrollCard>
    </div>
  );
}
