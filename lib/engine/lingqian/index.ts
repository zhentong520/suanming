import { loadContentJson } from "@/lib/content/catalog";
import { createSeededRng, hashString, seedFromDate } from "../shared/iching-lines";

const LEVEL_DETAIL: Record<string, string> = {
  上上: "上上签，大吉之象，所求多能如愿，但须心存善念，不可骄奢。",
  上吉: "上吉签，吉利顺遂，宜积极进取，贵人暗助。",
  中吉: "中吉签，吉中有平，事可成但需努力，不可懈怠。",
  中平: "中平签，吉凶参半，守成为上，不宜冒险。",
  下: "下签，多有阻滞，宜反躬自省，静待时机。",
};

export function computeLingqian(question?: string, seed?: number) {
  const lingqianData = loadContentJson<{ signs: Array<{
    number: number;
    level: string;
    poem: string;
    story: string;
    interpretation: string;
    career?: string;
    wealth?: string;
    love?: string;
    health?: string;
  }> }>("lingqian.json");
  const signs = lingqianData.signs;
  const d = new Date();
  const resolvedSeed = seed ?? seedFromDate(d, hashString(question ?? "lingqian") + 99);
  const rng = createSeededRng(resolvedSeed);
  const sign = signs[Math.floor(rng() * signs.length) % signs.length];

  const career =
    sign.career ??
    (sign.level.includes("上")
      ? "事业有转机，宜把握机遇，主动争取。"
      : sign.level === "下"
        ? "事业恐有波折，宜守不宜攻，韬光养晦。"
        : "事业平稳，宜踏实做事，不宜冒进。");

  const wealth =
    sign.wealth ??
    (sign.level.includes("上")
      ? "财运渐旺，正财为主，见好就收。"
      : "财运平平，量入为出，不宜投机。");

  const love =
    sign.love ??
    (sign.level.includes("上")
      ? "姻缘和顺，单身者有望遇良缘。"
      : "感情宜多沟通，避免误会冷战。");

  const health = sign.health ?? "身心宜调养，规律作息，勿过劳。";

  return {
    number: sign.number,
    level: sign.level,
    levelDetail: LEVEL_DETAIL[sign.level] ?? "签文吉凶需结合所问之事体会。",
    poem: sign.poem,
    story: sign.story,
    interpretation: sign.interpretation,
    career,
    wealth,
    love,
    health,
    seed: resolvedSeed,
    question: question ?? "一般求签",
    sections: [
      { title: "签号", content: `第${sign.number}签【${sign.level}】` },
      { title: "签诗", content: sign.poem },
      { title: "典故", content: sign.story },
      { title: "签意", content: sign.interpretation },
      { title: "等级解说", content: LEVEL_DETAIL[sign.level] ?? "" },
      { title: "事业", content: career },
      { title: "财运", content: wealth },
      { title: "姻缘", content: love },
      { title: "健康", content: health },
    ],
    summary: `第${sign.number}签【${sign.level}】${sign.poem} — ${sign.interpretation}`,
    caveat: "同问同种子可复现抽签结果。",
  };
}
