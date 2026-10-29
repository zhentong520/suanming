import { Solar } from "lunar-typescript";
import { getAlmanacForDate, BirthInput, computeCalendar } from "../calendar";
import { computeBazi } from "../bazi";
import { scoreGanZhiAgainstYongShen, type WuXing } from "../bazi/strength";
import { dayJiuXing } from "./jiuxing";

export interface AlmanacDayPick {
  date: string;
  ganZhiDay: string;
  yongShenLabel: "吉" | "平" | "凶";
  yongShenScore: number;
  yongShenReason: string;
  yi: string[];
  ji: string[];
  chong: string;
  personalChong: boolean;
  fitScore: number;
  note: string;
}

function dayGanZhi(date: Date): string {
  const lunar = Solar.fromDate(date).getLunar();
  return lunar.getEightChar().getDay();
}

function fitForActivity(yi: string[], ji: string[], activity: string): number {
  const map: Record<string, RegExp> = {
    嫁娶: /嫁娶|纳采|订盟|冠笄/,
    开市: /开市|立券|交易|纳财/,
    出行: /出行|移徙|赴任/,
    动土: /动土|破土|修造|安葬/,
    签约: /立券|交易|签约|纳财/,
  };
  const re = map[activity] ?? new RegExp(activity);
  let s = 50;
  if (yi.some((x) => re.test(x))) s += 25;
  if (ji.some((x) => re.test(x))) s -= 30;
  return s;
}

export function computeAlmanac(dateStr?: string, profile?: BirthInput) {
  const date = dateStr ? new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`) : new Date();
  const almanac = getAlmanacForDate(date);
  const ganZhi = dayGanZhi(date);
  const lunarDay = Solar.fromDate(date).getLunar().getDay();
  const jiuXing = dayJiuXing(lunarDay);

  let personalHint = "";
  let yongShenDay: AlmanacDayPick | null = null;
  let upcomingPicks: AlmanacDayPick[] = [];
  let profileZodiac = "";
  let usefulGods: WuXing[] = [];
  let avoidGods: WuXing[] = [];

  if (profile) {
    const cal = computeCalendar(profile);
    profileZodiac = cal.shengXiao;
    const personalChong = almanac.chong.includes(cal.shengXiao);
    personalHint = `您的生肖为${cal.shengXiao}，今日${
      personalChong ? "冲煞与您生肖相关，行事宜谨慎。" : "无直接冲煞，可按常规安排。"
    }`;

    const bazi = computeBazi(profile);
    usefulGods = (bazi.yongShen?.usefulGods ?? []) as WuXing[];
    avoidGods = (bazi.yongShen?.avoidGods ?? []) as WuXing[];
    const scored = scoreGanZhiAgainstYongShen(ganZhi, usefulGods, avoidGods);
    const baseFit = scored.score + (personalChong ? -15 : 5);
    yongShenDay = {
      date: almanac.date,
      ganZhiDay: ganZhi,
      yongShenLabel: scored.label,
      yongShenScore: scored.score,
      yongShenReason: scored.reason,
      yi: almanac.yi,
      ji: almanac.ji,
      chong: almanac.chong,
      personalChong,
      fitScore: Math.max(0, Math.min(100, baseFit)),
      note:
        scored.label === "吉"
          ? "本日干支助喜用，宜推进重要事务（仍看宜忌）。"
          : scored.label === "凶"
            ? "本日干支近忌神，宜守成，大事可改期。"
            : "本日干支中性，以黄历宜忌与实际情况为准。",
    };

    // 未来 14 天择日候选
    for (let i = 0; i < 14; i++) {
      const d = new Date(date);
      d.setDate(d.getDate() + i);
      const a = getAlmanacForDate(d);
      const gz = dayGanZhi(d);
      const sc = scoreGanZhiAgainstYongShen(gz, usefulGods, avoidGods);
      const chongSelf = a.chong.includes(cal.shengXiao);
      const marry = fitForActivity(a.yi, a.ji, "嫁娶");
      const open = fitForActivity(a.yi, a.ji, "开市");
      const travel = fitForActivity(a.yi, a.ji, "出行");
      const activityBoost = Math.max(marry, open, travel) - 50;
      const fit = sc.score + activityBoost + (chongSelf ? -18 : 4);
      upcomingPicks.push({
        date: a.date,
        ganZhiDay: gz,
        yongShenLabel: sc.label,
        yongShenScore: sc.score,
        yongShenReason: sc.reason,
        yi: a.yi.slice(0, 6),
        ji: a.ji.slice(0, 6),
        chong: a.chong,
        personalChong: chongSelf,
        fitScore: Math.max(0, Math.min(100, Math.round(fit))),
        note: `嫁娶适配${marry} · 开市${open} · 出行${travel}`,
      });
    }
    upcomingPicks.sort((a, b) => b.fitScore - a.fitScore);
    upcomingPicks = upcomingPicks.slice(0, 5);
  }

  return {
    ...almanac,
    ganZhiDay: ganZhi,
    personalHint,
    profileZodiac: profileZodiac || undefined,
    usefulGods,
    avoidGods,
    yongShenDay,
    upcomingPicks,
    jiuXing,
    recommendation:
      almanac.yi.length > 0 ? `宜：${almanac.yi.slice(0, 5).join("、")}` : "今日宜静不宜动。",
    avoid: almanac.ji.length > 0 ? `忌：${almanac.ji.slice(0, 5).join("、")}` : "无特别禁忌。",
    baziLinkNote: profile
      ? "已结合您的八字喜用神评分日柱，并给出近两周较优候选日。"
      : "登录并选择档案后，可按八字喜用神联动择日。",
  };
}
