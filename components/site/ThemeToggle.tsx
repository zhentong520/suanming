"use client";

import { useOptionalTheme } from "./ThemeProvider";

const LABELS: Record<string, string> = {
  light: "日",
  night: "夜",
  auto: "随",
};

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const ctx = useOptionalTheme();
  if (!ctx) return null;

  const { mode, cycleMode } = ctx;

  return (
    <button
      type="button"
      className={`theme-toggle${compact ? " theme-toggle--compact" : ""}`}
      onClick={cycleMode}
      title={`主题：${mode === "light" ? "日间" : mode === "night" ? "夜观" : "跟随系统"}`}
      aria-label="切换日/夜主题"
    >
      <span className="theme-toggle-icon" aria-hidden>
        {mode === "night" ? "月" : mode === "auto" ? "玄" : "日"}
      </span>
      {!compact && <span className="theme-toggle-label">{LABELS[mode] ?? "日"}</span>}
    </button>
  );
}
