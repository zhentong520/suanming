import { Solar, Lunar } from "lunar-typescript";
import { placeShenJiang, tianDiPan, isDayTime } from "./daliuren-shenjiang";

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

const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/** 天干寄宫 */
const STEM_PALACE: Record<string, number> = {
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
const MONTH_JIANG: Record<number, number> = {
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

const WX: Record<string, string> = {
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

function controls(a: string, b: string) {
  return KE[a] === b;
}

/** 月将加时：返回地盘索引 → 天盘地支索引 */
function buildTianPan(monthJiangIdx: number, hourZhiIdx: number): number[] {
  const pan = Array.from({ length: 12 }, (_, di) => 0);
  for (let i = 0; i < 12; i++) {
    pan[(hourZhiIdx + i) % 12] = (monthJiangIdx + i) % 12;
  }
  return pan;
}

function yinShen(tianPan: number[], tianZhiIdx: number): number {
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

  // 取传：贼克 → 比用 → 涉害 → 遥克 → 昴星/别责 → 干上发用
  type Hit = { shangIdx: number; kind: string; travel?: number; keName?: string };
  const zeiHits: Hit[] = [];
  const keHits: Hit[] = [];
  for (const k of siKeRaw) {
    const sWx = WX[k.shang];
    const xWx = WX[k.xia];
    const sIdx = BRANCHES.indexOf(k.shang as (typeof BRANCHES)[number]);
    const xIdx = BRANCHES.indexOf(k.xia as (typeof BRANCHES)[number]);
    const travel = (sIdx - xIdx + 12) % 12;
    if (controls(xWx, sWx)) zeiHits.push({ shangIdx: sIdx, kind: "贼", travel, keName: k.name });
    else if (controls(sWx, xWx)) keHits.push({ shangIdx: sIdx, kind: "克", travel, keName: k.name });
  }

  let preferred: Hit | undefined;
  let method = "";

  const tryOne = (list: Hit[], label: string) => {
    if (list.length === 1) {
      preferred = list[0];
      method = `${label}取传`;
      return true;
    }
    return false;
  };

  if (!tryOne(zeiHits, "贼") && !tryOne(keHits, "克")) {
    const pool = zeiHits.length ? zeiHits : keHits;
    if (pool.length > 1) {
      // 比用：上下五行比和者优先
      const biYong = pool.find((h) => {
        const k = siKeRaw.find(
          (x) => BRANCHES.indexOf(x.shang as (typeof BRANCHES)[number]) === h.shangIdx
        );
        return k && WX[k.shang] === WX[k.xia];
      });
      if (biYong) {
        preferred = biYong;
        method = "比用取传";
      } else {
        const sheHai = [...pool].sort((a, b) => (b.travel ?? 0) - (a.travel ?? 0));
        preferred = sheHai[0];
        method = `涉害（行${sheHai[0].travel ?? 0}位）`;
      }
    }
  }

  if (!preferred) {
    const sheHai = siKeRaw
      .map((k) => {
        const sIdx = BRANCHES.indexOf(k.shang as (typeof BRANCHES)[number]);
        const xIdx = BRANCHES.indexOf(k.xia as (typeof BRANCHES)[number]);
        return { shangIdx: sIdx, travel: (sIdx - xIdx + 12) % 12, kind: "涉害" };
      })
      .sort((a, b) => b.travel - a.travel);
    if (sheHai[0] && sheHai[0].travel >= 3) {
      preferred = sheHai[0];
      method = `涉害（行${sheHai[0].travel}位）`;
    }
  }

  if (!preferred) {
    const pairs: Array<[number, number]> = [
      [0, 2],
      [1, 3],
    ];
    for (const [a, b] of pairs) {
      const ka = siKeRaw[a];
      const kb = siKeRaw[b];
      const aWx = WX[ka.shang];
      const bWx = WX[kb.shang];
      if (controls(aWx, bWx) || controls(bWx, aWx)) {
        const winner = controls(aWx, bWx) ? ka : kb;
        preferred = {
          shangIdx: BRANCHES.indexOf(winner.shang as (typeof BRANCHES)[number]),
          kind: "遥克",
        };
        method = "遥克取传";
        break;
      }
    }
  }

  if (!preferred) {
    // 昴星/别责简化：阳日取酉上神，阴日取酉下神对应；别责取干上前一位
    const yangDay = ["甲", "丙", "戊", "庚", "壬"].includes(dayGan);
    if (yangDay) {
      preferred = { shangIdx: tianPan[9] ?? ke1Tian, kind: "昴星" }; // 酉=9
      method = "昴星取传";
    } else {
      preferred = { shangIdx: (ke1Tian + 11) % 12, kind: "别责" };
      method = "别责取传";
    }
  }

  const chu = preferred.shangIdx;
  if (!method) method = "干上发用";
  const zhong = yinShen(tianPan, chu);
  const mo = yinShen(tianPan, zhong);

  const sanChuan = [
    {
      name: "初传",
      zhi: BRANCHES[chu],
      meaning: method,
    },
    { name: "中传", zhi: BRANCHES[zhong], meaning: "初传阴神" },
    { name: "末传", zhi: BRANCHES[mo], meaning: "中传阴神" },
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
