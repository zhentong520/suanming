/** 日家紫白九星（简化）：以农历日序映射，供择日参考 */
export type JiuXingId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const JIU_XING: Record<
  JiuXingId,
  { name: string; color: string; nature: "吉" | "平" | "凶"; tip: string }
> = {
  1: { name: "一白贪狼", color: "白", nature: "吉", tip: "宜求财、姻缘、动土装修之始。" },
  2: { name: "二黑巨门", color: "黑", nature: "凶", tip: "宜静不宜动，避病符与争讼。" },
  3: { name: "三碧禄存", color: "碧", nature: "凶", tip: "防口舌是非、官非冲动。" },
  4: { name: "四绿文曲", color: "绿", nature: "平", tip: "利文昌学业，宅事中平。" },
  5: { name: "五黄廉贞", color: "黄", nature: "凶", tip: "宅事大忌，勿动土搬迁。" },
  6: { name: "六白武曲", color: "白", nature: "吉", tip: "利权威、远行、开业。" },
  7: { name: "七赤破军", color: "赤", nature: "平", tip: "破中有成，宜收尾不宜新开。" },
  8: { name: "八白左辅", color: "白", nature: "吉", tip: "当今运财星，宜置产安床。" },
  9: { name: "九紫右弼", color: "紫", nature: "吉", tip: "喜庆桃花文书皆宜。" },
};

/** 简化日九星：农历日对 9 取余（余 0 视为 9） */
export function dayJiuXing(lunarDay: number): {
  id: JiuXingId;
  name: string;
  color: string;
  nature: "吉" | "平" | "凶";
  tip: string;
  note: string;
} {
  const day = Math.max(1, Math.min(30, Math.floor(lunarDay) || 1));
  const id = ((day % 9) || 9) as JiuXingId;
  const meta = JIU_XING[id];
  return {
    id,
    ...meta,
    note: "据《金符经》九星择日思路简化：日子本身无绝对吉凶，宜结合所办之事与个人喜用；卦不二占，心乱则不如信己。",
  };
}
