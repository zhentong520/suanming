import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getModuleDefinition } from "@/lib/hub/module-registry";

export const runtime = "edge";

const CATEGORY_STYLE: Record<string, { bg: string; accent: string; label: string }> = {
  命: { bg: "#1a1210", accent: "#b83a2f", label: "观命之理" },
  卜: { bg: "#101418", accent: "#5a6d94", label: "决疑问卦" },
  相: { bg: "#181610", accent: "#a67c2e", label: "察形知意" },
  术: { bg: "#101612", accent: "#3d5a4c", label: "日用术数" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const moduleId = searchParams.get("module") ?? "home";
  const mod = moduleId !== "home" ? getModuleDefinition(moduleId) : undefined;

  const title = searchParams.get("title") ?? mod?.name ?? "易道命理";
  const category = searchParams.get("category") ?? mod?.category ?? "术";
  const desc = searchParams.get("desc") ?? mod?.description ?? "观象玩辞 · 知命而行";
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE["术"];
  const glyph = category;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(145deg, ${style.bg} 0%, #0a0908 100%)`,
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 60,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              border: `3px solid ${style.accent}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: style.accent,
              fontSize: 32,
              transform: "rotate(-6deg)",
            }}
          >
            {glyph}
          </div>
          <span style={{ color: "#8a8070", fontSize: 22, letterSpacing: 4 }}>{style.label}</span>
        </div>
        <div
          style={{
            width: 120,
            height: 120,
            border: `4px solid ${style.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: style.accent,
            fontSize: 64,
            marginBottom: 32,
            transform: "rotate(-6deg)",
          }}
        >
          易
        </div>
        <div style={{ fontSize: 56, color: "#f5efe4", letterSpacing: 8, marginBottom: 16 }}>{title}</div>
        <div style={{ fontSize: 26, color: "#a09888", letterSpacing: 2, maxWidth: 900, textAlign: "center" }}>
          {desc}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            fontSize: 22,
            color: style.accent,
            letterSpacing: 6,
          }}
        >
          易道命理
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
