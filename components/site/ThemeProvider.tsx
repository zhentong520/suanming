"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "night" | "auto";

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: "light" | "night";
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const STORAGE_KEY = "yidao-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(mode: ThemeMode): "light" | "night" {
  if (mode === "night") return "night";
  if (mode === "light") return "light";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "night";
  }
  return "light";
}

function applyTheme(resolved: "light" | "night") {
  document.documentElement.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "night" ? "#141210" : "#f5efe4");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [resolved, setResolved] = useState<"light" | "night">("light");

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem(STORAGE_KEY, next);
    const r = resolveTheme(next);
    setResolved(r);
    applyTheme(r);
  }, []);

  const cycleMode = useCallback(() => {
    const order: ThemeMode[] = ["light", "night", "auto"];
    const idx = order.indexOf(mode);
    setMode(order[(idx + 1) % order.length]);
  }, [mode, setMode]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial = stored === "light" || stored === "night" || stored === "auto" ? stored : "auto";
    setModeState(initial);
    const r = resolveTheme(initial);
    setResolved(r);
    applyTheme(r);
  }, []);

  useEffect(() => {
    if (mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const r = resolveTheme("auto");
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const value = useMemo(() => ({ mode, resolved, setMode, cycleMode }), [mode, resolved, setMode, cycleMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function useOptionalTheme() {
  return useContext(ThemeContext);
}
