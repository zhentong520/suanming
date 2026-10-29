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
  const lifePath = reduceToSingle(
    dateStr.split("").reduce((a, b) => a + Number(b), 0)
  );

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

  return {
    lifePathNumber: lifePath,
    lifePathMeaning: LIFE_PATH_MEANINGS[lifePath] ?? "数理平常，宜勤勉自励。",
    expressionNumber: expression,
    expressionMeaning: expression ? LIFE_PATH_MEANINGS[expression] : undefined,
    birthDate: `${input.year}-${input.month}-${input.day}`,
    summary: `生命灵数${lifePath}：${LIFE_PATH_MEANINGS[lifePath] ?? "宜因势利导。"}`,
  };
}
