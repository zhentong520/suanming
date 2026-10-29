import { qimenFromLunar, taiyiFromLunar, daliurenKe } from "../shared/lunar-advanced";
import { computeQimenSanYuan } from "../shared/qimen-sanyuan";
import { seedFromDate } from "../shared/iching-lines";

const GATE_DETAIL: Record<string, { meaning: string; career: string; direction: string; advice: string }> = {
  休: { meaning: "休门主休息、和解、退让", career: "宜谈判调解，不宜强攻", direction: "北方", advice: "以柔克刚，蓄势待发" },
  生: { meaning: "生门主生长、求财、发展", career: "利于开业、求职、投资", direction: "东北", advice: "积极进取，把握生机" },
  伤: { meaning: "伤门主伤害、竞争、捕猎", career: "竞争激烈的行业可一试，但防损耗", direction: "东方", advice: "速战速决，不宜拖延" },
  杜: { meaning: "杜门主阻塞、隐匿、保密", career: "宜研发、策划，不宜公开宣传", direction: "东南", advice: "韬光养晦，暗中布局" },
  景: { meaning: "景门主文书、考试、宣传", career: "利于考试、面试、展示", direction: "南方", advice: "注重形象与表达" },
  死: { meaning: "死门主结束、土地、丧葬", career: "不宜新开项目，宜收尾结算", direction: "西南", advice: "止戈守成，化解旧怨" },
  惊: { meaning: "惊门主惊恐、官司、口舌", career: "防突发状况，合同需审慎", direction: "西方", advice: "冷静应对，避免冲动" },
  开: { meaning: "开门主开创、出行、求官", career: "大吉之门，宜求职、创业、出行", direction: "西北", advice: "果断行动，广开局面" },
};

const STAR_DETAIL: Record<string, string> = {
  天蓬: "主智谋、冒险，亦主暗昧之事，宜智取不宜力敌。",
  天芮: "主疾病、问题，宜先解决隐患再图发展。",
  天冲: "主冲动、行动，利于快速推进，防过激。",
  天辅: "主辅佐、文教，利于学习考试、寻求贵人。",
  天禽: "居中调和，主平衡稳定，事可成于中庸。",
  天心: "主医药、决策，利于治病、谋略、领导。",
  天柱: "主破坏、毁折，宜守不宜攻，防破损。",
  天任: "主信任、担当，利于合作、任职。",
  天英: "主文明、光彩，利于宣传、文艺、社交。",
  天辅星: "主辅佐、文教，利于学习考试、寻求贵人。",
  天禽星: "居中调和，主平衡稳定，事可成于中庸。",
};

const GOD_DETAIL: Record<string, string> = {
  值符: "值符主贵人、主导，临宫事权在握。",
  螣蛇: "螣蛇主虚惊怪异、文书反复，宜核实信息。",
  太阴: "太阴主阴私、谋划、女贵，宜暗中布局。",
  六合: "六合主和合、婚姻、交易，利于签约合作。",
  白虎: "白虎主凶险、血光、官非，宜防伤灾。",
  玄武: "玄武主盗贼、欺诈、暗耗，宜防小人。",
  九地: "九地主沉静、隐蔽、守成，宜韬光。",
  九天: "九天主高远、扩张、声名，宜进取。",
};

const GENERAL_DETAIL: Record<string, string> = {
  贵人: "天乙贵人，主贵助、解厄，临传多有靠山。",
  螣蛇: "主惊恐、虚诈、文书纠缠。",
  朱雀: "主口舌、文书、信息与名声。",
  六合: "主和合、婚姻、交易顺利。",
  勾陈: "主田土、迟滞、纠缠不清。",
  青龙: "主喜庆、财帛、生机。",
  天空: "主虚空、不实、徒劳。",
  白虎: "主凶灾、疾病、官非。",
  太常: "主衣食、宴会、平常安稳。",
  玄武: "主盗失、阴谋、暗昧。",
  太阴: "主阴私、女人、隐秘谋划。",
  天后: "主慈荫、母亲、阴柔助力。",
};

const GATE_FROM_NAME: Record<string, string> = {
  休门: "休",
  生门: "生",
  伤门: "伤",
  杜门: "杜",
  景门: "景",
  死门: "死",
  惊门: "惊",
  开门: "开",
};

function normalizeGate(gateRaw: string): string {
  const g = GATE_FROM_NAME[gateRaw] ?? gateRaw.replace("门", "");
  return GATE_DETAIL[g] ? g : "开";
}

function normalizeStar(starRaw: string): string {
  const s = starRaw.replace(/星$/, "");
  return STAR_DETAIL[s] || STAR_DETAIL[starRaw] ? s : "天辅";
}

export function computeQimen(question?: string, date?: Date) {
  const d = date ?? new Date();
  const q = qimenFromLunar(d);
  const plate = computeQimenSanYuan(d);
  const qText = question ?? "";
  // 按所问映射用神门：财→生，官→开，病→死/芮，婚→休/合，争→伤…
  let focusIdx = 0;
  const gatePrefer =
    /财|钱|投资|生意/.test(qText)
      ? "生"
      : /官|升|职|考试|求名/.test(qText)
        ? "开"
        : /病|医|健康/.test(qText)
          ? "死"
          : /婚|恋|和|合/.test(qText)
            ? "休"
            : /争|诉|竞|打/.test(qText)
              ? "伤"
              : /隐|密|研发/.test(qText)
                ? "杜"
                : /文|宣传|考试/.test(qText)
                  ? "景"
                  : null;
  if (gatePrefer) {
    const found = plate.plate.findIndex((p) => normalizeGate(p.gate) === gatePrefer);
    if (found >= 0) focusIdx = found;
  } else {
    const hourIdx = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"].indexOf(plate.hourZhi);
    focusIdx = hourIdx >= 0 ? hourIdx % 9 : 0;
  }
  const focus = plate.plate[focusIdx] ?? plate.plate[0];
  const gate = normalizeGate(focus.gate);
  const star = normalizeStar(focus.star);
  const gateInfo = GATE_DETAIL[gate];
  const starText = STAR_DETAIL[star] ?? STAR_DETAIL["天辅"];

  return {
    question: question ?? "一般问事",
    datetime: q.datetime,
    jieQi: plate.jieQi,
    yuan: plate.yuan,
    ju: plate.juName,
    zhiFu: plate.zhiFu,
    zhiShi: plate.zhiShi,
    kongWang: plate.kongWang,
    jiGong: plate.jiGong,
    maXing: plate.maXing,
    menPo: plate.menPo,
    jiXing: plate.jiXing,
    star,
    gate,
    direction: focus.position,
    pattern: plate.pattern,
    starWuXing: q.starWuXing,
    luck: q.luck,
    gateMeaning: gateInfo.meaning,
    starMeaning: starText,
    godMeaning: GOD_DETAIL[focus.god] ?? `${q.yinYang}，${q.luck}`,
    plate: plate.plate,
    yongShenRule: gatePrefer ? `按所问取${gatePrefer}门为用` : "按时辰落宫为用",
    sections: [
      {
        title: "局式",
        content: `${plate.juName}（${plate.yuan}），节气${plate.jieQi}，${plate.pattern}\n时柱${plate.timeGan}${plate.hourZhi}\n值符${plate.zhiFu} · 值使${plate.zhiShi}\n${plate.jiGong} · 日空${plate.kongWang || "—"} · 马星${plate.maXing}\n门迫：${(plate.menPo ?? []).join("、") || "无"} · 击刑：${(plate.jiXing ?? []).join("、") || "无"}\n所问：${question ?? "一般问事"}\n用神取法：${gatePrefer ? `问事关键词→${gatePrefer}门` : "时辰落宫"}`,
      },
      {
        title: "九宫盘",
        content: plate.plate
          .map(
            (p) =>
              `${p.palace}：${p.gate}门·${p.star}·${p.god}｜地${p.diGan}天${p.tianGan}${p.menPo ? "〔门迫〕" : ""}${p.jiXing ? "〔击刑〕" : ""}`
          )
          .join("\n"),
      },
      { title: "用神宫", content: `${focus.palace}（${focus.position}） — ${gate}门配${star}，${focus.god}当值。${GOD_DETAIL[focus.god] ?? ""}` },
      { title: "八神", content: Object.entries(GOD_DETAIL).map(([k, v]) => `${k}：${v}`).join("\n") },
      { title: "八门", content: `${gate}门 — ${gateInfo.meaning}。${gateInfo.advice}` },
      { title: "九星", content: `${star} — ${starText}` },
      { title: "吉凶", content: `奇门${q.luck}，${q.yinYang}。` },
      { title: "方位", content: `用神在${focus.position}，${gate}门利${gateInfo.direction}方行事。` },
      { title: "事业", content: `${gateInfo.career}（用神：${focus.palace}${gate}门·${star}·${focus.god}）` },
      {
        title: "财运",
        content: [
          `用神落${focus.palace}，${gate}门配${star}，八神${focus.god}。`,
          gate === "生" || gate === "开"
            ? "生门、开门主财，当前利于求财、开业、签约。"
            : gate === "景"
              ? "景门主文书与名声，财来于展示、品牌。"
              : "财运宜守成，大额投资宜缓。",
          (plate.menPo ?? []).length ? `门迫：${plate.menPo!.join("、")}，推进宜避其方位硬冲。` : "",
        ]
          .filter(Boolean)
          .join(""),
      },
      {
        title: "感情",
        content: [
          `用神${gate}门·${focus.god}：${GOD_DETAIL[focus.god] ?? ""}`,
          q.luck.includes("吉")
            ? "门星得吉，利婚姻、合作、和解。"
            : "宜温和沟通，可选生门、开门方位行事。",
        ].join(""),
      },
      {
        title: "健康",
        content: [
          `九星${star}落用神宫。`,
          star === "天芮"
            ? "天芮主疾，宜体检调养。"
            : gate === "伤" || gate === "死"
              ? "防意外与旧疾，宜静养。"
              : "整体无大碍，规律作息即可。",
          (plate.jiXing ?? []).length ? `击刑：${plate.jiXing!.join("、")}，行动宜缓。` : "",
        ]
          .filter(Boolean)
          .join(""),
      },
      { title: "综合建议", content: `${plate.juName}${gate}门配${star}，${q.luck}。${gateInfo.advice}` },
    ],
    summary: `${plate.juName}${gate}门配${star}（${q.luck}），${plate.yuan}${plate.jieQi}，宜向${gateInfo.direction}行事。`,
    caveat: "三元换局九宫盘已排；含天地盘干、八神、门迫击刑、中宫寄坤、日空与马星。用神按所问关键词优先落门，否则按时辰宫。",
  };
}

export function computeDaliuren(question?: string, date?: Date) {
  const d = date ?? new Date();
  const ke = daliurenKe(d);

  return {
    question: question ?? "一般问事",
    datetime: d.toISOString(),
    dayGanZhi: ke.dayGanZhi,
    timeGanZhi: ke.timeGanZhi,
    monthJiang: ke.monthJiang,
    siKe: ke.siKe,
    sanChuan: ke.sanChuan,
    takeMethod: ke.takeMethod,
    tianPan: ke.tianPan,
    diPan: ke.diPan,
    xun: ke.xun,
    xunKong: ke.xunKong,
    shenJiang: ke.shenJiang,
    timeDunGan: ke.timeDunGan,
    isDayKe: ke.isDayKe,
    sections: [
      { title: "日课", content: `日柱${ke.dayGanZhi}，时柱${ke.timeGanZhi}，旬${ke.xun}，空亡${Array.isArray(ke.xunKong) ? ke.xunKong.join("、") : ke.xunKong}` },
      { title: "四课", content: ke.siKe.map((k) => `${k.name}：${k.zhi}（${k.desc}）`).join("\n") },
      {
        title: "三传",
        content: `月将${ke.monthJiang}加时起课。取传法：${ke.takeMethod}\n${ke.sanChuan.map((s) => `${s.name}${s.zhi}（${s.meaning}）`).join("\n")}`,
      },
      {
        title: "神将",
        content: ke.shenJiang
          .map((s) => `${s.general}→${s.branch}（${GENERAL_DETAIL[s.general] ?? ""}）`)
          .join("\n"),
      },
      {
        title: "遁干",
        content: `时遁干${ke.timeDunGan}，${ke.isDayKe ? "昼课" : "夜课"}。天盘：${ke.tianDiPan.slice(0, 4).map((p) => `${p.branch}${p.stem}`).join(" ")}…`,
      },
      { title: "天地盘", content: `天盘${ke.tianPan}，地盘${ke.diPan}` },
      {
        title: "断语",
        content: `取传法：${ke.takeMethod}。初传${ke.sanChuan[0].zhi}主事起（乘${ke.shenJiang.find((s) => s.branch === ke.sanChuan[0].zhi)?.general ?? "将"}：${GENERAL_DETAIL[ke.shenJiang.find((s) => s.branch === ke.sanChuan[0].zhi)?.general ?? ""] ?? "详参神将"}），中传${ke.sanChuan[1].zhi}主过程，末传${ke.sanChuan[2].zhi}主结局。`,
      },
      {
        title: "事业",
        content: `初传${ke.sanChuan[0].zhi}乘${ke.shenJiang.find((s) => s.branch === ke.sanChuan[0].zhi)?.general ?? "神将"}，取传「${ke.takeMethod}」。${
          ke.sanChuan[2].zhi === "寅" || ke.sanChuan[2].zhi === "午" || ke.sanChuan[2].zhi === "戌"
            ? "末传见火局，事业有转机，宜主动争取，但需防急躁。"
            : "事有波折，宜稳扎稳打，借助贵人，不宜独断。"
        }`,
      },
      {
        title: "财运",
        content: `财看初传${ke.sanChuan[0].zhi}与所乘之将；课式「${ke.takeMethod}」。当前宜量入为出，大额投资需再三斟酌。`,
      },
      {
        title: "感情",
        content: `三传${ke.sanChuan.map((s) => s.zhi).join("→")}，课传相递则关系有变；初传神将提示：${GENERAL_DETAIL[ke.shenJiang.find((s) => s.branch === ke.sanChuan[0].zhi)?.general ?? ""] ?? "宜开诚布公"}。忌冷战猜疑。`,
      },
      { title: "健康", content: `日空${Array.isArray(ke.xunKong) ? ke.xunKong.join("、") : ke.xunKong}，宜防小疾反复，作息规律，减少过劳。` },
      { title: "建议", content: `大六壬以课传为要，已按日干支、时干支起四课三传（${ke.takeMethod}），宜结合所问细观初传${ke.sanChuan[0].zhi}。` },
    ],
    summary: `日${ke.dayGanZhi}时${ke.timeGanZhi}，三传${ke.sanChuan.map((s) => s.zhi).join("→")}（${ke.takeMethod}），贵人${ke.shenJiang[0]?.general}在${ke.shenJiang[0]?.branch}。`,
    caveat: "四课按月将加时、干支寄宫；三传取传链：贼克→比用→涉害→遥克→昴星/别责→干上发用。",
  };
}

const TAIYI_DETAIL: Record<string, string> = {
  太乙: "太乙主大局、帝王之位，事涉根本方向。",
  天乙: "天乙主贵人、辅佐，有贵人相助之象。",
  地乙: "地乙主根基、地利，宜稳扎稳打。",
  五乙: "五乙主变化、转机，事有变通之机。",
  君基: "君主之基，利于决策与统领。",
  臣基: "臣佐之基，利于执行与配合。",
  民基: "民众之基，利于大众、市场之事。",
  四神: "四神主辅助力量，宜借力而行。",
  天九: "天九主圆满、极致，事近尾声或高峰。",
  一白: "一白主水，宜智谋流动，利于谋划。",
  二黑: "二黑主土，宜守成谨慎，防阻滞。",
  三碧: "三碧主木，宜生发进取，防争执。",
  四绿: "四绿主木，利于文教传播。",
  五黄: "五黄主土，变动较大，宜静不宜大动。",
  六白: "六白主金，利于权威决断。",
  七赤: "七赤主金，防口舌是非。",
  八白: "八白主土，利于置业积累。",
  九紫: "九紫主火，利于名声喜庆。",
};

export function computeTaiyi(question?: string, date?: Date) {
  const d = date ?? new Date();
  const t = taiyiFromLunar(d);
  const star = t.star.replace(/太乙$/, "") || t.star;
  const starMeaning = TAIYI_DETAIL[star] ?? `${t.starType}，${t.song}`;
  const trend = t.starType.includes("阳") || t.wuXing === "火" ? "可进取" : "守势为宜";

  const yearNum = d.getFullYear() % 10;
  const monthNum = d.getMonth() + 1;
  const dayNum = d.getDate();
  const hourNum = d.getHours();
  const junJi = yearNum;
  const chenJi = monthNum % 10;
  const minJi = dayNum % 10;
  const liuYi = ["甲子", "甲戌", "甲申", "甲午", "甲辰", "甲寅"][(hourNum + dayNum) % 6];

  return {
    question: question ?? "一般问事",
    ju: t.starNumber,
    taiyiStar: t.star,
    starType: t.starType,
    song: t.song,
    jieQi: t.jieQi,
    trend,
    starMeaning,
    sanJi: { 君基: junJi, 臣基: chenJi, 民基: minJi },
    liuYi,
    sections: [
      { title: "局式", content: `${t.jieQi ? `节气${t.jieQi}，` : ""}太乙${t.starNumber}宫\n${t.song}` },
      { title: "三基", content: `君基${junJi}（年）· 臣基${chenJi}（月）· 民基${minJi}（日）\n三基和${junJi + chenJi + minJi}，主事体层次。` },
      { title: "六仪", content: `当前六仪：${liuYi}，与太乙${t.star}联动论吉凶。` },
      { title: "主星", content: `${t.star}（${t.wuXing}） — ${starMeaning}` },
      { title: "星类", content: t.starType },
      { title: "趋势", content: `${trend}。${t.position}当值。` },
      {
        title: "事业",
        content:
          t.starType.includes("君") || star.includes("白")
            ? "主星利决策与权威，事业宜争取核心位置。"
            : "事业宜观太乙大局，顺势而为。",
      },
      { title: "财运", content: trend === "可进取" ? "财运随进取而开，宜把握机遇。" : "宜守财积累。" },
      { title: "感情", content: "太乙主宏观，顺运则婚嫁可成，逆运则宜修己待人。" },
      { title: "健康", content: "身心宜平衡，规律作息以养气。" },
      { title: "综合", content: `${t.star}${t.starType}，三基${junJi}/${chenJi}/${minJi}。${t.song}当前宜${trend}。` },
    ],
    summary: `太乙${t.star}（${t.starType}），三基${junJi}/${chenJi}/${minJi}，六仪${liuYi}。${t.song}`,
    caveat: "已含三基六仪与时家太乙九星，更细推演可配十六神。",
  };
}

export function computeBeijiao(question?: string, date?: Date) {
  const d = date ?? new Date();
  const seed = seedFromDate(d, (question ?? "").length * 17);
  const r = (seed % 1000) / 1000;
  let result: string;
  let meaning: string;
  let detail: string;
  let advice: string;
  if (r < 0.33) {
    result = "圣杯（一正一反）";
    meaning = "神明应允，所问可行。";
    detail = "一阴一阳，阴阳调和，为吉兆。表示所问之事得天意默许，可放心推进。";
    advice = "宜择吉日行事，心存敬意，不可妄为。";
  } else if (r < 0.66) {
    result = "笑杯（两正）";
    meaning = "情况未明，神明未置可否。";
    detail = "两阳在上，意未分明。所问之事时机未到，或条件尚不成熟，需再请示。";
    advice = "宜静心反省所问是否妥当，三日后再掷杯。";
  } else {
    result = "阴杯（两反）";
    meaning = "神明不准，所问不宜。";
    detail = "两阴在下，主否定之象。所问之事恐有阻碍，或与当下时势不合。";
    advice = "宜调整方向或推迟计划，勿强行推进。";
  }

  return {
    question: question ?? "一般问事",
    result,
    meaning,
    detail,
    advice,
    sections: [
      { title: "掷杯结果", content: result },
      { title: "签意", content: meaning },
      { title: "详解", content: detail },
      {
        title: "事业",
        content:
          result.includes("圣杯")
            ? "所问事业得天意默许，可推进求职、签约、开业等事宜。"
            : result.includes("笑杯")
              ? "事业时机未明，宜再准备或三日后再问，不可急躁。"
              : "事业宜暂缓或调整方向，勿强行推进。",
      },
      { title: "财运", content: result.includes("圣杯") ? "财运可试，但宜正大光明求财。" : "不宜大额投资或借贷。" },
      { title: "感情", content: result.includes("圣杯") ? "感情事宜可推进，宜择吉表达。" : "感情宜等待或反省，忌冲动决定。" },
      { title: "建议", content: advice },
    ],
    summary: `掷杯得${result}：${meaning} ${detail}`,
    caveat: "掷杯按问事时辰_seed 确定性出象，同问同时结果一致。",
  };
}
