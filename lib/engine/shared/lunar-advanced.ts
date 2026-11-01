import { Solar, Lunar } from "lunar-typescript";
import { placeShenJiang, tianDiPan, isDayTime } from "./daliuren-shenjiang";
import { liuRenSanChuan } from "./liuren-jiuzongmen";

/** 当前或指定时刻的农历对象 */
export function lunarFromDate(date?: Date): Lunar {
  const solar = Solar.fromDate(date ?? new Date());
  return solar.getLunar();
}

/** 小六壬：从大安起子时顺数至当前时辰 */
const XLR_GONG = ["大安", "留连", "速喜", "赤口", "小吉", "空亡"] as const;

export function xiaoliurenGongIndex(date?: Date): number {
  const lunar = lunarFromDate(date);
  const hourZhi = lunar.getTimeZhi();
  const zhiList = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  const hourIdx = zhiList.indexOf(hourZhi);
  return (hourIdx + 0) % 6;
}

export function xiaoliurenGong(date?: Date) {
  const idx = xiaoliurenGongIndex(date);
  const lunar = lunarFromDate(date);
  return {
    gong: XLR_GONG[idx],
    index: idx + 1,
    hourZhi: lunar.getTimeZhi(),
    liuYao: lunar.getLiuYao(),
    jieQi: lunar.getCurrentJieQi()?.getName() ?? lunar.getPrevJieQi(true)?.getName(),
  };
}

/** 时家奇门：用时家九星 */
export function qimenFromLunar(date?: Date) {
  const lunar = lunarFromDate(date);
  const star = lunar.getTimeNineStar();
  const jieQi = lunar.getCurrentJieQi()?.getName() ?? lunar.getPrevJieQi(true)?.getName() ?? "";
  const yang = star.getYinYangInQiMen().includes("阳");
  return {
    datetime: Solar.fromDate(date ?? new Date()).toYmdHms(),
    jieQi,
    pattern: yang ? "阳遁" : "阴遁",
    star: star.getNameInQiMen(),
    gate: star.getBaMenInQiMen(),
    starNumber: star.getNumber(),
    starWuXing: star.getWuXing(),
    starPosition: star.getPositionDesc(),
    luck: star.getLuckInQiMen(),
    yinYang: star.getYinYangInQiMen(),
    beiDou: star.getNameInBeiDou(),
  };
}

/** 太乙：用时家九星太乙系 */
export function taiyiFromLunar(date?: Date) {
  const lunar = lunarFromDate(date);
  const star = lunar.getTimeNineStar();
  const jieQi = lunar.getCurrentJieQi()?.getName() ?? "";
  return {
    datetime: Solar.fromDate(date ?? new Date()).toYmdHms(),
    jieQi,
    star: star.getNameInTaiYi(),
    starType: star.getTypeInTaiYi(),
    song: star.getSongInTaiYi(),
    starNumber: star.getNumber(),
    wuXing: star.getWuXing(),
    position: star.getPositionDesc(),
  };
}

export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/** 天干寄宫 */
export const STEM_PALACE: Record<string, number> = {
  甲: 2,
  乙: 4,
  丙: 5,
  丁: 7,
  戊: 5,
  己: 7,
  庚: 8,
  辛: 10,
  壬: 11,
  癸: 1,
};

/** 农历月 → 月将地支索引（亥将起正月） */
export const MONTH_JIANG: Record<number, number> = {
  1: 11,
  2: 10,
  3: 9,
  4: 8,
  5: 7,
  6: 6,
  7: 5,
  8: 4,
  9: 3,
  10: 2,
  11: 1,
  12: 0,
};

export const WX: Record<string, string> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export function controls(a: string, b: string) {
  return KE[a] === b;
}

/** 月将加时：返回地盘索引 → 天盘地支索引 */
export function buildTianPan(monthJiangIdx: number, hourZhiIdx: number): number[] {
  const pan = Array.from({ length: 12 }, (_, di) => 0);
  for (let i = 0; i < 12; i++) {
    pan[(hourZhiIdx + i) % 12] = (monthJiangIdx + i) % 12;
  }
  return pan;
}

export function yinShen(tianPan: number[], tianZhiIdx: number): number {
  // 天盘神所临之地盘，再取该地盘上之天盘神
  const di = tianPan.indexOf(tianZhiIdx);
  if (di < 0) return (tianZhiIdx + 6) % 12;
  return tianPan[di];
}

/** 大六壬：月将加时四课 + 贼克取三传（实用简化） */
export function daliurenKe(date?: Date) {
  const d = date ?? new Date();
  const lunar = lunarFromDate(d);
  const ec = lunar.getEightChar();
  const dayGan = ec.getDayGan();
  const dayZhi = ec.getDayZhi();
  const timeZhi = ec.getTimeZhi();
  const dayZhiIdx = BRANCHES.indexOf(dayZhi as (typeof BRANCHES)[number]);
  const timeZhiIdx = BRANCHES.indexOf(timeZhi as (typeof BRANCHES)[number]);
  const hour = d.getHours();
  const lunarMonth = Math.abs(lunar.getMonth()) || 1;
  const monthJiangIdx = MONTH_JIANG[lunarMonth] ?? 11;
  const tianPan = buildTianPan(monthJiangIdx, timeZhiIdx >= 0 ? timeZhiIdx : 0);

  const ganPalace = STEM_PALACE[dayGan] ?? dayZhiIdx;
  const ke1Tian = tianPan[ganPalace];
  const ke2Tian = yinShen(tianPan, ke1Tian);
  const ke3Tian = tianPan[dayZhiIdx >= 0 ? dayZhiIdx : 0];
  const ke4Tian = yinShen(tianPan, ke3Tian);

  const siKeRaw = [
    { name: "一课", shang: BRANCHES[ke1Tian], xia: BRANCHES[ganPalace], desc: "日干寄宫上神" },
    { name: "二课", shang: BRANCHES[ke2Tian], xia: BRANCHES[ke1Tian], desc: "一课阴神" },
    { name: "三课", shang: BRANCHES[ke3Tian], xia: dayZhi, desc: "日支上神" },
    { name: "四课", shang: BRANCHES[ke4Tian], xia: BRANCHES[ke3Tian], desc: "三课阴神" },
  ];

  const siKe = siKeRaw.map((k) => ({
    name: k.name,
    zhi: k.shang,
    desc: `${k.desc}（上${k.shang}临下${k.xia}）`,
  }));

  // 取传：九宗门引擎（贼克→比用→涉害→遥克→昴星→别责→八专→伏吟→返吟，分课体定中末）
  const jzm = liuRenSanChuan({
    dayGan,
    dayZhi,
    timeZhi,
    monthJiangIdx,
    timeZhiIdx: timeZhiIdx >= 0 ? timeZhiIdx : 0,
    siKeRaw: siKeRaw.map((k) => ({ name: k.name, shang: k.shang, xia: k.xia })),
    tianPan,
    ganPalace,
  });

  const chu = jzm.chuan[0];
  const zhong = jzm.chuan[1];
  const mo = jzm.chuan[2];
  const method = `${jzm.keTi}：${jzm.method}`;

  const sanChuan = [
    {
      name: "初传",
      zhi: BRANCHES[chu],
      meaning: method,
    },
    { name: "中传", zhi: BRANCHES[zhong], meaning: "中传" },
    { name: "末传", zhi: BRANCHES[mo], meaning: "末传" },
  ];

  const shenJiang = placeShenJiang(dayGan, hour);
  const { tianPan: tianDi, diPan, timeDunGan } = tianDiPan(
    dayGan,
    dayZhiIdx >= 0 ? dayZhiIdx : 0,
    timeZhiIdx >= 0 ? timeZhiIdx : 0
  );

  return {
    dayGanZhi: `${dayGan}${dayZhi}`,
    timeGanZhi: `${ec.getTimeGan()}${timeZhi}`,
    monthJiang: BRANCHES[monthJiangIdx],
    siKe,
    sanChuan,
    takeMethod: method,
    keTi: jzm.keTi,
    keTiNature: jzm.keTiNature,
    jzmNotes: jzm.notes,
    tianPan: BRANCHES[(dayZhiIdx + 6) % 12],
    diPan: dayZhi,
    xun: ec.getDayXun(),
    xunKong: ec.getDayXunKong(),
    shenJiang,
    tianDiPan: tianDi,
    diPanStem: diPan,
    timeDunGan,
    isDayKe: isDayTime(hour),
  };
}
