import { loadContentJson } from "@/lib/content/catalog";

interface WordRadicalsData {
  wuxingByRadical: Record<string, string>;
  structureHints: Record<string, string>;
  radicals: Record<string, string>;
  strokes: Record<string, number>;
}

function getWordRadicals() {
  return loadContentJson<WordRadicalsData>("word-radicals.json");
}

function getRadical(char: string): string {
  const map = getWordRadicals().radicals;
  return map[char] ?? char;
}

function countStrokes(char: string): number {
  const map = getWordRadicals().strokes;
  return map[char] ?? char.charCodeAt(0) % 20 + 1;
}

export function computeWordDivination(chars: string, question?: string) {
  const wordRadicals = getWordRadicals();
  const wuxingByRadical = wordRadicals.wuxingByRadical;
  const structureHints = wordRadicals.structureHints;

  const wordList = [...chars.replace(/\s/g, "")].slice(0, 3);
  if (wordList.length === 0) throw new Error("请输入至少一个汉字");

  const analysis = wordList.map((char) => {
    const radical = getRadical(char);
    const strokes = countStrokes(char);
    const wuxing = wuxingByRadical[radical] ?? "土";
    const structure = strokes % 2 === 0 ? "阴" : "阳";
    return {
      char,
      radical,
      strokes,
      wuxing,
      structure,
      hint: structureHints[structure] ?? "字形平常，宜观其所问而定。",
    };
  });

  const totalStrokes = analysis.reduce((a, b) => a + b.strokes, 0);
  const dominantWuxing = analysis.map((a) => a.wuxing).sort(
    (a, b) =>
      analysis.filter((x) => x.wuxing === b).length -
      analysis.filter((x) => x.wuxing === a).length
  )[0];

  const trend =
    totalStrokes % 3 === 0
      ? "事有反复，需耐心等待。"
      : totalStrokes % 3 === 1
        ? "初有阻滞，后渐顺遂。"
        : "当下可行，宜果断推进。";

  return {
    chars: wordList.join(""),
    question: question ?? "一般问事",
    analysis,
    totalStrokes,
    dominantWuxing,
    trend,
    summary: `所测「${wordList.join("")}」总笔画${totalStrokes}，主${dominantWuxing}气。${trend}`,
    caveat: "测字解读具有象意性，仅供文化参考。",
  };
}
