"use client";

/**
 * 分享摘要图卡片：1080×1440（3:4，朋友圈比例），玄金夜空风。
 * 纯客户端 Canvas 绘制，系统衬线字体，无外部依赖。
 */

export interface ShareCardInput {
  moduleTitle: string;
  lines: string[]; // 摘要行（已提取）
  siteName?: string;
  dateText?: string;
}

const W = 1080;
const H = 1440;

// 固定种子随机（每次绘制同一张卡星点一致）
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function wrapLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxChars: number): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const truncated = line.length > maxChars * 4 ? `${line.slice(0, maxChars * 4)}…` : line;
    let current = "";
    for (const ch of truncated) {
      if (ctx.measureText(current + ch).width > maxWidth) {
        out.push(current);
        current = ch;
      } else {
        current += ch;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

/** 从模板报告提取摘要行（去【】与▎节标题、限行数） */
export function extractSummaryLines(report: string, maxLines = 8): string[] {
  const cleaned = report
    .replace(/【.+?】/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !l.startsWith("※") &&
        !l.startsWith("▎") &&
        !l.startsWith("综合评分") &&
        !/^[\s—-]+$/.test(l)
    );
  return cleaned.slice(0, maxLines);
}

export function drawShareCard(input: ShareCardInput): string {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const siteName = input.siteName ?? "易道命理";
  const serif = `"Noto Serif SC", "Source Han Serif SC", "STSong", serif`;

  // 1) 玄紫黑渐变底
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#17131f");
  bg.addColorStop(0.55, "#120f19");
  bg.addColorStop(1, "#0d0b13");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 2) 星云光晕
  const glow1 = ctx.createRadialGradient(W * 0.5, H * 0.08, 0, W * 0.5, H * 0.08, W * 0.7);
  glow1.addColorStop(0, "rgba(138, 151, 201, 0.10)");
  glow1.addColorStop(1, "rgba(138, 151, 201, 0)");
  ctx.fillStyle = glow1;
  ctx.fillRect(0, 0, W, H);
  const glow2 = ctx.createRadialGradient(W * 0.15, H * 0.75, 0, W * 0.15, H * 0.75, W * 0.5);
  glow2.addColorStop(0, "rgba(201, 168, 106, 0.08)");
  glow2.addColorStop(1, "rgba(201, 168, 106, 0)");
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, W, H);

  // 3) 星点（固定种子）
  const rand = mulberry32(20261031);
  for (let i = 0; i < 150; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 0.6 + rand() * 1.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(227, 193, 134, ${(0.12 + rand() * 0.3).toFixed(2)})`;
    ctx.fill();
  }

  // 4) 金色双线边框 + 四角饰
  ctx.strokeStyle = "rgba(201, 168, 106, 0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 46, W - 92, H - 92);
  ctx.strokeStyle = "rgba(201, 168, 106, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(62, 62, W - 124, H - 124);
  ctx.strokeStyle = "rgba(227, 193, 134, 0.9)";
  ctx.lineWidth = 4;
  const corner = 56;
  const cs: Array<[number, number, number, number]> = [
    [46, 46, 1, 1],
    [W - 46, 46, -1, 1],
    [46, H - 46, 1, -1],
    [W - 46, H - 46, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of cs) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * corner);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * corner, cy);
    ctx.stroke();
  }

  let y = 168;

  // 5) 站名 + 副题
  ctx.textAlign = "center";
  ctx.fillStyle = "#e3c186";
  ctx.font = `400 88px ${serif}`;
  ctx.shadowColor = "rgba(201, 168, 106, 0.4)";
  ctx.shadowBlur = 30;
  ctx.fillText(siteName, W / 2, y);
  ctx.shadowBlur = 0;
  y += 56;
  ctx.fillStyle = "rgba(192, 178, 148, 0.85)";
  ctx.font = `400 30px ${serif}`;
  ctx.fillText("·  AI 命 理 测 算  ·", W / 2, y);

  // 分隔线
  y += 52;
  const divGrad = ctx.createLinearGradient(140, 0, W - 140, 0);
  divGrad.addColorStop(0, "rgba(201, 168, 106, 0)");
  divGrad.addColorStop(0.5, "rgba(201, 168, 106, 0.7)");
  divGrad.addColorStop(1, "rgba(201, 168, 106, 0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(140, y);
  ctx.lineTo(W - 140, y);
  ctx.stroke();

  // 6) 模块名
  y += 118;
  ctx.fillStyle = "#e8ddc4";
  ctx.font = `600 84px ${serif}`;
  ctx.fillText(input.moduleTitle, W / 2, y);

  // 7) 摘要正文（自动换行，最多 9 行）
  y += 96;
  ctx.textAlign = "left";
  ctx.font = `400 34px ${serif}`;
  const bodyLines: string[] = [];
  for (const line of input.lines) {
    bodyLines.push(...wrapLine(ctx, line, W - 320, 20));
  }
  const shown = bodyLines.slice(0, 9);
  for (const line of shown) {
    ctx.fillStyle = "rgba(232, 221, 196, 0.88)";
    ctx.fillText(line, 170, y);
    y += 62;
  }

  // 8) 朱砂印章（右下）
  const sealS = 132;
  const sx = W - 210;
  const sy = H - 400;
  ctx.fillStyle = "rgba(168, 50, 40, 0.92)";
  ctx.fillRect(sx, sy, sealS, sealS);
  ctx.fillStyle = "#f5e8e0";
  ctx.font = `400 52px ${serif}`;
  ctx.textAlign = "center";
  ctx.fillText("易", sx + sealS / 2, sy + 58);
  ctx.fillText("道", sx + sealS / 2, sy + 116);

  // 9) 底部：日期 + slogan + 合规
  ctx.fillStyle = "rgba(138, 125, 100, 0.9)";
  ctx.font = `400 26px ${serif}`;
  ctx.fillText(input.dateText ?? new Date().toLocaleDateString("zh-CN"), W / 2, H - 190);
  ctx.fillStyle = "#c9a86a";
  ctx.font = `400 34px ${serif}`;
  ctx.fillText("前往测一测 · 知命而不惑", W / 2, H - 130);
  ctx.fillStyle = "rgba(138, 125, 100, 0.6)";
  ctx.font = `400 22px ${serif}`;
  ctx.fillText("内容经合规处理，仅供文化娱乐参考", W / 2, H - 82);

  return canvas.toDataURL("image/png");
}
