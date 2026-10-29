import { loadContentJson } from "@/lib/content/catalog";
import { BirthInput, buildLunarFromBirth, eightCharFromBirth } from "../calendar";

interface ChengguEntry {
  weight: number;
  song: string;
  summary: string;
  level: string;
}

interface ChengguData {
  weights: Record<string, number>;
  songs: ChengguEntry[];
}

function getChengguData() {
  return loadContentJson<ChengguData>("chenggu-songs.json");
}

function lookupWeight(type: "year" | "month" | "day" | "hour", value: string, hour?: number): number {
  const table = getChengguData().weights;
  if (type === "hour" && hour != null) {
    const key = String(hour);
    return table[`hour_${key}`] ?? 1;
  }
  const key = `${type}_${value}`;
  return table[key] ?? 1;
}

function getSong(totalWeight: number): ChengguEntry {
  const entry = getChengguData().songs.find(
    (s) => totalWeight >= s.weight && totalWeight < s.weight + 1
  );
  return (
    entry ?? {
      weight: totalWeight,
      song: "命途多舛，需以勤勉自励。",
      summary: "骨重中等，宜守正道。",
      level: "中等",
    }
  );
}

export function computeChenggu(input: BirthInput) {
  const { lunar } = buildLunarFromBirth(input);
  const eightChar = eightCharFromBirth(lunar, input);

  const yearWeight = lookupWeight("year", eightChar.getYear());
  const monthWeight = lookupWeight("month", String(input.month));
  const dayWeight = lookupWeight("day", String(input.day));
  const hourWeight =
    input.hour != null ? lookupWeight("hour", "", input.hour) : 1;

  const total = yearWeight + monthWeight + dayWeight + hourWeight;
  const song = getSong(total);

  return {
    yearWeight,
    monthWeight,
    dayWeight,
    hourWeight,
    totalWeight: total,
    totalWeightStr: `${Math.floor(total / 10)}两${Math.round((total % 10) * 10) / 10}钱`,
    song: song.song,
    summary: song.summary,
    level: song.level,
  };
}
