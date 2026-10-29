/** 生年四化飞入宫位的断语 */
const HUA_MEANING: Record<string, string> = {
  禄: "化禄主财禄机遇、顺利、口福，落入宫位多有增益。",
  权: "化权主权柄、能力、掌控，落入宫位增强主导力。",
  科: "化科主名声、文书、贵人，利于考试口碑与形象。",
  忌: "化忌主阻滞、操心、是非，落入宫位需谨慎经营。",
};

const PALACE_FOCUS: Record<string, string> = {
  命宫: "自身性格与一生基调",
  兄弟: "手足同辈与合作关系",
  夫妻: "婚姻感情与配偶",
  子女: "子女缘与部属晚辈",
  财帛: "理财求财与金钱观",
  疾厄: "健康体质与灾厄",
  迁移: "外出变动与环境",
  仆役: "朋友部属与人际",
  官禄: "事业功名与职场",
  田宅: "不动产与家庭环境",
  福德: "精神享受与福气",
  父母: "父母长辈与文书贵人",
};

export function interpretSiHuaFlying(
  sihua: Array<{ star: string; hua: string; palace?: string }>
): string {
  if (!sihua.length) return "未见四化数据。";
  return sihua
    .map((s) => {
      const palace = s.palace ?? "未知宫";
      const focus = PALACE_FOCUS[palace] ?? palace;
      const hua = HUA_MEANING[s.hua] ?? `化${s.hua}`;
      return `${s.star}化${s.hua}飞入${palace}（主${focus}）。${hua}${
        s.hua === "忌"
          ? `此宫事务易反复，宜多预留缓冲。`
          : s.hua === "禄"
            ? `此宫易见实质收获。`
            : s.hua === "权"
              ? `此宫宜主动担当。`
              : `此宫利名声文书。`
      }`;
    })
    .join("\n\n");
}

export function interpretKeyPalaceHua(
  sihua: Array<{ star: string; hua: string; palace?: string }>,
  palace: string
): string {
  const hits = sihua.filter((s) => s.palace === palace);
  if (!hits.length) return `${palace}无生年四化直接飞入，看主星庙旺与对宫即可。`;
  return hits.map((s) => `${s.star}化${s.hua}`).join("、") + ` 落${palace}，影响${PALACE_FOCUS[palace] ?? palace}。`;
}
