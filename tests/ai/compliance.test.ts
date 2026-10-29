import { describe, it, expect } from "vitest";
import {
  sanitizeAiText,
  compliantAiText,
  findForbiddenTerms,
  hasAiMarker,
} from "@/lib/ai/compliance";

describe("AI 输出合规风控", () => {
  it("替换玄学服务承诺类违禁词", () => {
    const out = sanitizeAiText("可佩戴开光饰品改运，另可做一场法事消灾。");
    expect(out).not.toMatch(/开光|改运|法事|消灾/);
    expect(findForbiddenTerms(out)).toHaveLength(0);
  });

  it("软化绝对化宿命断语", () => {
    const out = sanitizeAiText("此人事业必将腾飞，注定大富大贵，百分之百成功。");
    expect(out).not.toMatch(/必将|注定|百分之百/);
    expect(out).toContain("有望");
    expect(out).toContain("倾向于");
    expect(out).toContain("很大概率");
  });

  it("compliantAiText 追加显式 AI 生成标识", () => {
    const out = compliantAiText("性格沉稳，事业倾向于稳步发展。");
    expect(hasAiMarker(out)).toBe(true);
    expect(out).toContain("仅供文化娱乐参考");
  });

  it("标识幂等：已带标识不重复追加", () => {
    const marked = "（本段解读由 AI 辅助生成）原文";
    expect(compliantAiText(marked)).toBe(marked);
  });

  it("findForbiddenTerms 返回全部命中词", () => {
    expect(findForbiddenTerms("推荐法事并开光手串，包你消灾")).toEqual([
      "消灾",
      "开光",
      "法事",
    ]);
  });
});
