import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { getModuleDefinition } from "@/lib/hub/module-registry";

export const runtime = "edge";

const CATEGORY_STYLE: Record<string, { bg: string; accent: string; label: string }> = {
  命: { bg: "#1d1420", accent: "#d45048", label: "观命之理" },
  卜: { bg: "#131625", accent: "#8a97c9", label: "决疑问卦" },
  相: { bg: "#1a1720", accent: "#c9a86a", label: "察形知意" },
  术: { bg: "#121815", accent: "#5da885", label: "日用术数" },
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
          background: `radial-gradient(ellipse 70% 45% at 50% 0%, rgba(138, 151, 201, 0.14), transparent), radial-gradient(ellipse 50% 35% at 80% 90%, rgba(90, 60, 140, 0.18), transparent), linear-gradient(175deg, #17131f 0%, #120f19 55%, #0d0b13 100%)`,
          fontFamily: "serif",
          border: "2px solid rgba(201, 168, 106, 0.4)",
        }}
      >
        {/* 星点：box-shadow 多点模拟 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 2,
            height: 2,
            borderRadius: 2,
            backgroundColor: "rgba(227, 193, 134, 0.5)",
            boxShadow:
              "140px 90px 0 1px rgba(227,193,134,0.35), 320px 200px 0 0 rgba(227,193,134,0.25), 520px 70px 0 1px rgba(227,193,134,0.4), 760px 150px 0 0 rgba(227,193,134,0.3), 980px 110px 0 1px rgba(227,193,134,0.35), 240px 420px 0 1px rgba(227,193,134,0.28), 1080px 380px 0 1px rgba(227,193,134,0.32), 880px 520px 0 0 rgba(227,193,134,0.26), 120px 520px 0 1px rgba(227,193,134,0.3), 640px 560px 0 1px rgba(227,193,134,0.22), 420px 40px 0 0 rgba(227,193,134,0.3), 1120px 250px 0 1px rgba(227,193,134,0.3)",
          }}
        />
        {/* 印章 */}
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
            boxShadow: `0 0 40px ${style.accent}33`,
          }}
        >
          易
        </div>
        <div
          style={{
            fontSize: 58,
            color: "#e8ddc4",
            letterSpacing: 8,
            marginBottom: 16,
            textShadow: "0 0 24px rgba(201, 168, 106, 0.4)",
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 26, color: "#a89b80", letterSpacing: 2, maxWidth: 900, textAlign: "center" }}>
          {desc}
        </div>
        {/* 底部金线 + 站名 */}
        <div
          style={{
            position: "absolute",
            bottom: 72,
            left: 260,
            width: 680,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(201, 168, 106, 0.6), transparent)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 24,
            color: "#c9a86a",
            letterSpacing: 8,
          }}
        >
          易 道 命 理 · 知 命 而 不 惑
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
