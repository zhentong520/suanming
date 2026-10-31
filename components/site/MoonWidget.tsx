"use client";

import { useMemo } from "react";
import { Solar } from "lunar-typescript";
import { useTheme } from "@/components/site/ThemeProvider";

/**
 * 夜观主题的真实月相挂角：
 * 按今日农历日近似月龄计算照亮比例与盈亏方向，渲染 SVG 月相 + 月相名。
 * 仅夜观主题显示，悬停显示月相说明。
 */
const PHASE_NAMES = ["新月", "娥眉月", "上弦月", "盈凸月", "满月", "亏凸月", "下弦月", "残月"];

function phaseIndex(age: number): number {
  const p = (age / 29.53) * 8;
  return Math.floor(p + 0.5) % 8;
}

export function MoonWidget() {
  const { resolved } = useTheme();

  const phase = useMemo(() => {
    if (resolved !== "night") return null;
    try {
      // 农历日近似月龄（初一≈新月），精度足够做展示性月相
      const lunar = Solar.fromDate(new Date()).getLunar();
      const approximateAge = Math.min(lunar.getDay() - 1, 29.53);
      const waxing = approximateAge < 14.765;
      const illum = (1 - Math.cos((approximateAge / 29.53) * Math.PI * 2)) / 2;
      return { age: approximateAge, name: PHASE_NAMES[phaseIndex(approximateAge)], illum, waxing };
    } catch {
      return null;
    }
  }, [resolved]);

  if (resolved !== "night" || !phase) return null;

  const size = 92;
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  // 明暗分界椭圆的横向半径（由照亮比例决定）
  const k = Math.abs(2 * phase.illum - 1); // 0=半亮 1=全亮/全暗
  const terminator = r * k;

  return (
    <div className="moon-widget" title={`${phase.name} · 月龄约 ${phase.age.toFixed(1)} 日 · 照亮 ${Math.round(phase.illum * 100)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(232, 221, 196, 0.25)" />
            <stop offset="100%" stopColor="rgba(232, 221, 196, 0)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r * 1.9} fill="url(#moon-glow)" />
        <circle cx={cx} cy={cy} r={r} fill="#2a2438" stroke="rgba(201, 168, 106, 0.25)" strokeWidth="1" />
        {/* 明面：先画右半（盈）或左半（亏）半圆，再用椭圆修正 */}
        <path
          d={
            phase.waxing
              ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${terminator} ${r} 0 0 ${phase.illum <= 0.5 ? 1 : 0} ${cx} ${cy - r} Z`
              : `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${terminator} ${r} 0 0 ${phase.illum <= 0.5 ? 0 : 1} ${cx} ${cy - r} Z`
          }
          fill="#e8ddc4"
          opacity="0.92"
        />
      </svg>
      <span className="moon-label">{phase.name}</span>
    </div>
  );
}
