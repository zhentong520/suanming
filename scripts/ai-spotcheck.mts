/**
 * AI 解读质量抽查脚本：
 *   npx tsx --tsconfig tsconfig.json scripts/ai-spotcheck.mts            # 默认 bazi + liuyao
 *   npx tsx --tsconfig tsconfig.json scripts/ai-spotcheck.mts bazi ziwei  # 指定模块
 *
 * 依赖 .env.local 的 VOLC_ARK_API_KEY；对每个模块：
 *  1. 用真实引擎产出 facts → 模板报告 → 组装锚定 prompt
 *  2. 调用火山模型生成解读 → 合规清洗
 *  3. 自动质检「去套话铁律」：开篇硬事实、禁用空洞开场/段落起手式
 * 结果打印到 stdout，便于人工复查与 prompt 迭代。
 */
import fs from "fs";
import path from "path";

for (const line of fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/ui-test.db";

const { computeBaziWithReading } = await import("@/lib/engine/bazi");
const { computeLiuyao } = await import("@/lib/engine/yijing");
const { computeZiwei } = await import("@/lib/engine/ziwei");
const { computeNameWuge } = await import("@/lib/engine/name-wuge");
const { computeAlmanac } = await import("@/lib/engine/almanac");
const { enrichModuleFacts } = await import("@/lib/engine/enrich-readings");
const { renderTemplateReport } = await import("@/lib/report/template-renderer");
const { buildAiEnhancePrompt } = await import("@/lib/ai/fact-digest");
const { createProvider } = await import("@/lib/ai/provider-interface");
const { getVolcEnvConfig } = await import("@/lib/ai/volc-models");
const { compliantAiText } = await import("@/lib/ai/compliance");

const volc = getVolcEnvConfig();
if (!volc.apiKey) {
  console.error("未找到 VOLC_ARK_API_KEY，请检查 .env.local");
  process.exit(1);
}
const provider = createProvider({
  id: "spotcheck",
  type: "volcengine",
  name: "volc",
  baseUrl: volc.baseUrl,
  apiKey: volc.apiKey,
  modelName: volc.textModel,
});
console.log(`model=${volc.textModel} baseUrl=${volc.baseUrl}`);

/** 去套话自动质检 */
function lintAntiCliche(text: string): string[] {
  const issues: string[] = [];
  const badOpeners = ["在中国传统文化", "人生如同", "命运长河", "命运的齿轮", "自古以来"];
  const first = text.trim().slice(0, 40);
  if (badOpeners.some((o) => first.includes(o))) issues.push(`开篇空话:「${first}…」`);
  const badParaStarts = ["总体而言", "综上所述", "总的来说", "从整体来看"];
  for (const para of text.split(/\n+/)) {
    const t = para.trim();
    if (badParaStarts.some((b) => t.startsWith(b))) issues.push(`段落以套话开头:「${t.slice(0, 16)}…」`);
  }
  if (/(祝你|愿您)[^。\n]{0,10}(幸福|美满|顺利)/.test(text)) issues.push("出现万能祝福语");
  return issues;
}

type Sample = { moduleId: string; facts: Record<string, unknown>; tag: string };

const SAMPLES: Record<string, () => Sample> = {
  bazi: () => ({
    moduleId: "bazi",
    facts: computeBaziWithReading({
      calendarType: "solar", year: 1990, month: 5, day: 15, hour: 15, gender: "女",
      longitude: 121.47, latitude: 31.23, location: "上海",
    }) as unknown as Record<string, unknown>,
    tag: "八字·女命 1990-05-15 申时 上海",
  }),
  liuyao: () => ({
    moduleId: "liuyao",
    facts: computeLiuyao("事业发展前景如何") as unknown as Record<string, unknown>,
    tag: "六爻·问事业",
  }),
  ziwei: () => ({
    moduleId: "ziwei",
    facts: computeZiwei({
      calendarType: "solar", year: 1992, month: 8, day: 3, hour: 8, gender: "男",
    }) as unknown as Record<string, unknown>,
    tag: "紫微·男命 1992-08-03 辰时",
  }),
  name: () => ({
    moduleId: "name",
    facts: computeNameWuge("李思远", { surnameLen: 1 }) as unknown as Record<string, unknown>,
    tag: "姓名·李思远（男）",
  }),
  almanac: () => ({
    moduleId: "almanac",
    facts: computeAlmanac() as unknown as Record<string, unknown>,
    tag: "黄历·今日",
  }),
};

const targets = process.argv.slice(2).length ? process.argv.slice(2) : ["bazi", "liuyao"];
let allClean = true;

for (const key of targets) {
  const make = SAMPLES[key];
  if (!make) {
    console.error(`未知模块样本: ${key}（可选：${Object.keys(SAMPLES).join("/")}）`);
    continue;
  }
  const { moduleId, facts, tag } = make();
  const enriched = enrichModuleFacts(moduleId, facts, "zh");
  const template = renderTemplateReport(moduleId, enriched, undefined as never);
  const prompt = buildAiEnhancePrompt(moduleId, enriched, template, "zh");
  const t0 = Date.now();
  try {
    const out = await provider.complete(prompt, { maxTokens: 1200, temperature: 0.55, timeoutMs: 90_000 });
    const final = compliantAiText(out);
    const issues = lintAntiCliche(final);
    if (issues.length) allClean = false;
    console.log(
      `\n===== ${tag}（${((Date.now() - t0) / 1000).toFixed(1)}s，${out.length} 字）质检：${issues.length ? "❌ " + issues.join("；") : "✅ 通过"} =====`
    );
    console.log(final);
  } catch (err) {
    const msg = (err as Error).message;
    if (/429|Quota/i.test(msg)) {
      console.error(`\n===== ${tag} 配额受限（5 小时窗口重置后重跑即可）: ${msg.slice(0, 160)}`);
    } else {
      console.error(`\n===== ${tag} 生成失败: ${msg}`);
    }
    allClean = false;
  }
}

console.log(`\n===== 抽查结论: ${allClean ? "全部通过" : "存在问题，需迭代 prompt"} =====`);
process.exit(0);
