import { loadContentJson } from "@/lib/content/catalog";

const VALID_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP",
];

export function computeMbtiMatch(typeA: string, typeB: string) {
  const a = typeA.toUpperCase().trim();
  const b = typeB.toUpperCase().trim();
  if (!VALID_TYPES.includes(a) || !VALID_TYPES.includes(b)) {
    throw new Error("请输入有效的 MBTI 类型，如 INTJ、ENFP");
  }

  const compat = loadContentJson<Record<string, Record<string, { score: number; desc: string }>>>("mbti-compat.json");
  const pair = compat[a]?.[b] ?? compat[b]?.[a] ?? {
    score: 60,
    desc: "性格互补度中等，需通过沟通增进理解。",
  };

  const sameE = a[0] === b[0];
  const sameN = a[1] === b[1];
  const sameT = a[2] === b[2];
  const sameJ = a[3] === b[3];
  const matchCount = [sameE, sameN, sameT, sameJ].filter(Boolean).length;

  return {
    typeA: a,
    typeB: b,
    score: pair.score,
    description: pair.desc,
    dimensionMatch: { EI: sameE, SN: sameN, TF: sameT, JP: sameJ },
    matchCount,
    summary: `${a} × ${b}：${pair.score}分。${pair.desc}`,
  };
}

export function getMbtiTypes() {
  return VALID_TYPES;
}
