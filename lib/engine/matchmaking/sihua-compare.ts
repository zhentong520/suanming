/** 合婚：双方紫微生年四化对照 */

export type SiHuaLite = { star: string; hua: string; palace?: string };

const KEY_PALACES = ["命宫", "夫妻", "财帛", "官禄", "福德", "迁移"] as const;

export function compareDualSiHua(
  sihuaA: SiHuaLite[],
  sihuaB: SiHuaLite[],
  labelA = "A",
  labelB = "B"
): { score: number; notes: string[]; summary: string } {
  const notes: string[] = [];
  let score = 60;

  const byPalace = (list: SiHuaLite[], palace: string) => list.filter((s) => s.palace === palace);
  const huaOf = (list: SiHuaLite[], hua: string) => list.filter((s) => s.hua === hua);

  const fuA = byPalace(sihuaA, "夫妻");
  const fuB = byPalace(sihuaB, "夫妻");
  if (fuA.some((h) => h.hua === "禄" || h.hua === "科") && fuB.some((h) => h.hua === "禄" || h.hua === "科")) {
    score += 10;
    notes.push("双方夫妻宫皆见禄/科，婚恋宫气较清，宜共同经营。");
  }
  if (fuA.some((h) => h.hua === "忌") || fuB.some((h) => h.hua === "忌")) {
    score -= 12;
    notes.push(
      `夫妻宫见忌：${[
        fuA.filter((h) => h.hua === "忌").map((h) => `${labelA}${h.star}化忌`).join("、"),
        fuB.filter((h) => h.hua === "忌").map((h) => `${labelB}${h.star}化忌`).join("、"),
      ]
        .filter(Boolean)
        .join("；") || "一方夫妻宫化忌"}，感情易反复，宜制度沟通。`
    );
  }

  // A 忌入 B 关键宫 / B 忌入 A 关键宫
  for (const palace of KEY_PALACES) {
    const aJi = byPalace(sihuaA, palace).filter((h) => h.hua === "忌");
    const bJi = byPalace(sihuaB, palace).filter((h) => h.hua === "忌");
    const aLu = byPalace(sihuaA, palace).filter((h) => h.hua === "禄" || h.hua === "科");
    const bLu = byPalace(sihuaB, palace).filter((h) => h.hua === "禄" || h.hua === "科");
    if (aJi.length && bLu.length) {
      score -= 4;
      notes.push(`${labelA}化忌入${palace}，而${labelB}同宫见禄科，相处中该宫事务易一紧一松。`);
    }
    if (bJi.length && aLu.length) {
      score -= 4;
      notes.push(`${labelB}化忌入${palace}，而${labelA}同宫见禄科，宜互相体谅节奏差。`);
    }
    if (aLu.length && bLu.length && palace !== "夫妻") {
      score += 3;
      notes.push(`双方${palace}皆见禄/科，该宫主题（合作/财务/事业）较易同频。`);
    }
  }

  const jiA = huaOf(sihuaA, "忌");
  const jiB = huaOf(sihuaB, "忌");
  if (jiA[0] && jiB[0] && jiA[0].palace && jiA[0].palace === jiB[0].palace) {
    score -= 8;
    notes.push(`双方化忌同落${jiA[0].palace}，该宫压力叠加，宜提前约定分工与情绪出口。`);
  }

  const luA = huaOf(sihuaA, "禄");
  const luB = huaOf(sihuaB, "禄");
  if (luA.some((h) => h.palace === "夫妻") && luB.some((h) => h.palace === "福德" || h.palace === "迁移")) {
    score += 4;
    notes.push(`${labelA}禄入夫妻，${labelB}禄入福德/迁移，生活情趣与外出互动可互相滋养。`);
  }

  if (!notes.length) {
    notes.push("双方生年四化无强烈同宫冲忌，相处重点仍在日支夫妻宫与喜用交叉。");
  }

  score = Math.max(28, Math.min(95, score));
  const summary =
    score >= 75
      ? `四化对照偏吉（${score}分）：关键宫禄科多于忌，婚恋协作有气。`
      : score >= 55
        ? `四化对照中平（${score}分）：有互补也有忌入关键宫，宜对症沟通。`
        : `四化对照偏紧（${score}分）：忌入夫妻或关键宫叠加，需边界与耐心。`;

  return { score, notes: notes.slice(0, 8), summary };
}
