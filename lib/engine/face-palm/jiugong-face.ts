/** 九宫面相分区（脸如趴在洛书九宫上） */
export const JIUGONG_FACE = [
  { palace: 4, bagua: "巽", region: "右额 / 右太阳", meaning: "妻妾宫、文昌区；气色暗则思虑郁、文书不顺。" },
  { palace: 9, bagua: "离", region: "额央 / 印堂", meaning: "离火；赤红易口舌火气，悬针/川字纹宜护心脑血管。" },
  { palace: 2, bagua: "坤", region: "左额 / 左太阳", meaning: "父母宫一侧；观长辈缘与承托气场。" },
  { palace: 3, bagua: "震", region: "左颧 / 左颊（自观）", meaning: "震木主肝胆；斑痣闷气常见，亦主兄弟朋友助力。" },
  { palace: 5, bagua: "中宫", region: "鼻", meaning: "中宫宜明；鼻高翼肉财路通，露骨则土缺、包容差。" },
  { palace: 7, bagua: "兑", region: "右颧 / 右颊（自观）", meaning: "兑金主肺与口舌；干燥口臭常与肺火同见。" },
  { palace: 8, bagua: "艮", region: "左下颌", meaning: "艮土主变迁子女一侧；宜丰满有肉。" },
  { palace: 1, bagua: "坎", region: "下巴", meaning: "坎水主根基晚运；颏圆有力晚景稳。" },
  { palace: 6, bagua: "乾", region: "右下颌", meaning: "乾金主权贵事业一侧；宜方正不削。" },
] as const;

export function jiugongFaceSection(): { title: string; content: string } {
  const lines = JIUGONG_FACE.map(
    (p) => `【${p.palace}${p.bagua}·${p.region}】${p.meaning}`
  );
  return {
    title: "九宫面相",
    content: `面如趴在九宫：额离9、鼻中5、颏坎1，左右震兑。主流自观左3右7；亦有门派以观测者视角镜像，左右对称时不必强分。\n\n${lines.join("\n")}\n\n相由心生：鼻子可改气质、气质改人生轨迹；解读供文化参考。`,
  };
}
