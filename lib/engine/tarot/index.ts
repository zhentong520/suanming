import { loadContentJson } from "@/lib/content/catalog";
import { createSeededRng, hashString, seedFromDate, shuffleWithSeed } from "../shared/iching-lines";

const POSITION_MEANINGS: Record<string, string> = {
  过去: "代表问卜者过去的经历与潜意识影响，是当下处境的根源。",
  现在: "代表当前的核心状态与面临的课题，是解读的重点。",
  未来: "代表发展趋势与可能的结果，并非定数，可因行动而改变。",
  建议: "代表宇宙或内在智慧给出的行动指引。",
  结果: "代表若按当前轨迹发展，最可能抵达的终点。",
};

export function computeTarot(question?: string, spread = 3, seed?: number) {
  const tarotDeck = loadContentJson<{ cards: Array<{ name: string; meaning: string; reversed: string }> }>("tarot-deck.json");
  const d = new Date();
  const resolvedSeed = seed ?? seedFromDate(d, hashString(question ?? "tarot") + spread * 13);
  const shuffled = shuffleWithSeed(tarotDeck.cards, resolvedSeed);
  const rng = createSeededRng(resolvedSeed ^ 0x9e3779b9);
  const positions = ["过去", "现在", "未来", "建议", "结果"];
  const drawn = shuffled.slice(0, spread).map((card, i) => {
    const reversed = rng() > 0.7;
    const position = positions[i] ?? `位置${i + 1}`;
    return {
      position,
      name: card.name,
      reversed,
      meaning: reversed ? card.reversed : card.meaning,
      positionHint: POSITION_MEANINGS[position] ?? "此位置象征问卜中的一个维度。",
    };
  });

  const sections = drawn.map((c) => ({
    title: `${c.position} — ${c.name}${c.reversed ? "（逆位）" : "（正位）"}`,
    content: `${c.positionHint}\n\n${c.meaning}`,
  }));

  const reversedCount = drawn.filter((c) => c.reversed).length;
  const overall =
    reversedCount >= 2
      ? "牌阵逆位较多，暗示当前阻力较大，宜调整策略、反躬自省后再行推进。"
      : reversedCount === 0
        ? "牌阵全为正位，整体能量顺畅，所问之事多可积极推进。"
        : "正逆参半，事有起伏，宜灵活应对，把握正位牌所示的机遇。";

  sections.push({ title: "牌阵能量", content: overall });

  return {
    question: question ?? "一般问事",
    seed: resolvedSeed,
    spread: spread === 3 ? "三张牌阵（过去·现在·未来）" : spread === 5 ? "五张牌阵" : "单牌占卜",
    cards: drawn,
    sections,
    summary: `${drawn.map((c) => `${c.position}：${c.name}${c.reversed ? "（逆位）" : ""}`).join("；")}。${overall}`,
    caveat: "同问同种子结果可复现；随机性来自时间与问句哈希。",
  };
}
