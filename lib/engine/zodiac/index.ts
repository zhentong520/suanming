import { loadContentJson } from "@/lib/content/catalog";
import { BirthInput, computeCalendar } from "../calendar";

const ZODIAC_LIST = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

export function getZodiacFromYear(year: number): string {
  return ZODIAC_LIST[(year - 4) % 12];
}

export function computeZodiac(input: BirthInput) {
  const calendar = computeCalendar(input);
  const zodiac = calendar.shengXiao;
  const currentYear = new Date().getFullYear();
  const yearZodiac = getZodiacFromYear(currentYear);
  const rules = loadContentJson<Record<string, unknown>>("zodiac-rules.json");
  const zodiacInfo = rules[zodiac] as { traits: string; lucky: string[]; unlucky: string[]; fortune: string } | undefined;
  const info = zodiacInfo ?? {
    traits: "性格平和，宜顺势而为。",
    lucky: ["红", "南"],
    unlucky: ["北"],
    fortune: "本年运势平稳，宜守不宜攻。",
  };

  const relations = (rules.relations as Record<string, string>)[zodiac] ?? "无特殊关系";

  return {
    zodiac,
    yearZodiac,
    isTaiSui: zodiac === yearZodiac,
    traits: info.traits,
    lucky: info.lucky,
    unlucky: info.unlucky,
    fortune: info.fortune,
    relations,
    element: calendar.wuXing[0]?.replace(/[^金木水火土]/g, "") ?? "土",
  };
}

export function getZodiacRelation(a: string, b: string): { type: string; score: number; desc: string } {
  const liuHe: Record<string, string> = {
    鼠: "牛", 牛: "鼠", 虎: "猪", 猪: "虎", 兔: "狗", 狗: "兔",
    龙: "鸡", 鸡: "龙", 蛇: "猴", 猴: "蛇", 马: "羊", 羊: "马",
  };
  const liuChong: Record<string, string> = {
    鼠: "马", 马: "鼠", 牛: "羊", 羊: "牛", 虎: "猴", 猴: "虎",
    兔: "鸡", 鸡: "兔", 龙: "狗", 狗: "龙", 蛇: "猪", 猪: "蛇",
  };

  if (liuHe[a] === b) return { type: "六合", score: 90, desc: "六合相配，缘分深厚。" };
  if (liuChong[a] === b) return { type: "六冲", score: 40, desc: "六冲相对，需多包容。" };
  return { type: "普通", score: 65, desc: "关系平常，重在经营。" };
}
