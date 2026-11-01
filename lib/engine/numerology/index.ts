import { BirthInput } from "../calendar";

function reduceToSingle(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split("")
      .reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

const LIFE_PATH_MEANINGS: Record<number, string> = {
  1: "领导者气质，独立开创，宜自主决策。",
  2: "合作协调，敏感细腻，宜以柔克刚。",
  3: "表达创意，社交活跃，宜发挥才华。",
  4: "务实稳定，勤勉踏实，宜循序渐进。",
  5: "自由变动，冒险探索，宜灵活应变。",
  6: "责任关爱，家庭导向，宜服务他人。",
  7: "内省智慧，深度思考，宜钻研专精。",
  8: "权力成就，物质目标，宜商业经营。",
  9: "博爱理想，人道关怀，宜公益艺术。",
  11: "直觉灵感，精神领袖，宜启发他人。",
  22: "大师建造者，宏大愿景，宜长期规划。",
  33: "慈悲Teacher，奉献服务，宜教育疗愈。",
};

export function computeNumerology(input: BirthInput, fullName?: string) {
  const dateStr = `${input.year}${String(input.month).padStart(2, "0")}${String(input.day).padStart(2, "0")}`;
  const digits = dateStr.split("").map(Number);
  const rawSum = digits.reduce((a, b) => a + b, 0);

  // Karmic Debt（业债数）：约分链中经过 13/14/16/19
  const karmicDebt = [13, 14, 16, 19].find((kd) => {
    let n = rawSum;
    while (n > 9) {
      if (n === kd) return true;
      n = String(n).split("").reduce((a, b) => a + Number(b), 0);
    }
    return false;
  });
  const lifePath = reduceToSingle(rawSum);

  let expression: number | null = null;
  if (fullName) {
    const letterValues: Record<string, number> = {};
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((c, i) => {
      letterValues[c] = (i % 9) + 1;
    });
    const sum = [...fullName.toUpperCase().replace(/[^A-Z]/g, "")]
      .reduce((a, c) => a + (letterValues[c] ?? 0), 0);
    expression = reduceToSingle(sum);
  }

  // Lo Shu 洛书九宫：生日数字填格（4-9-2 / 3-5-7 / 8-1-6）
  const grid: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const d of digits) {
    if (d >= 1 && d <= 9) grid[d] += 1;
  }
  const missing = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => grid[n] === 0);
  const repeated = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => grid[n] >= 2);
  const MISSING_MEANING: Record<number, string> = {
    1: "缺1：主见与开创力宜自觉培养",
    2: "缺2：敏感度与配合度宜加强",
    3: "缺3：表达与创意宜多练习",
    4: "缺4：条理与执行力宜建立",
    5: "缺5：应变与自由度宜放开",
    6: "缺6：责任与关爱宜付出",
    7: "缺7：内省与研究宜深耕",
    8: "缺8：财商与掌控宜学习",
    9: "缺9：理想与博爱宜拓展",
  };

  // Kua 数（八卦命卦，立春界近似用公历年）
  const yy = input.year % 100;
  const isPost2000 = input.year >= 2000;
  let kua = input.gender === "女"
    ? (isPost2000 ? (yy + 6) % 9 : (yy + 5) % 9)
    : (isPost2000 ? (99 - yy) % 9 : (100 - yy) % 9);
  if (kua === 0) kua = input.gender === "女" ? 8 : 9;
  if (kua === 5) kua = input.gender === "女" ? 8 : 2;

  return {
    lifePathNumber: lifePath,
    lifePathMeaning: LIFE_PATH_MEANINGS[lifePath] ?? "数理平常，宜勤勉自励。",
    karmicDebt: karmicDebt
      ? { number: karmicDebt, note: `生命灵数约分中经过业债数 ${karmicDebt}——此课题为人生必修（13勤勉/14自由/16自省/19自立）。` }
      : null,
    expressionNumber: expression,
    expressionMeaning: expression ? LIFE_PATH_MEANINGS[expression] : undefined,
    loShu: {
      grid,
      missing,
      repeated,
      note: `洛书九宫：缺${missing.length ? missing.join("、") : "无"}${repeated.length ? `；重复${repeated.map((n) => `${n}×${grid[n]}`).join("、")}` : ""}。${missing.slice(0, 3).map((m) => MISSING_MEANING[m]).join("；")}`,
    },
    kuaNumber: kua,
    birthDate: `${input.year}-${input.month}-${input.day}`,
    summary: `生命灵数${lifePath}：${LIFE_PATH_MEANINGS[lifePath] ?? "宜因势利导。"}${karmicDebt ? `（业债数${karmicDebt}）` : ""}`,
  };
}
