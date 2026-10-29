import fs from "fs";
import path from "path";

export interface ContentFileMeta {
  id: string;
  file: string;
  title: string;
  description: string;
}

export const CONTENT_CATALOG: ContentFileMeta[] = [
  { id: "chenggu-songs", file: "chenggu-songs.json", title: "称骨歌诀", description: "袁天罡称骨重量与歌诀" },
  { id: "zodiac-rules", file: "zodiac-rules.json", title: "生肖规则", description: "十二生肖运势规则" },
  { id: "lingqian", file: "lingqian.json", title: "灵签签文", description: "观音灵签签诗与释义" },
  { id: "tarot-deck", file: "tarot-deck.json", title: "塔罗牌义", description: "塔罗牌正逆位释义" },
  { id: "name-strokes", file: "name-strokes.json", title: "姓名笔画", description: "姓名五格笔画字库" },
  { id: "word-radicals", file: "word-radicals.json", title: "测字部首", description: "测字部首与笔画象意" },
  { id: "face-rules", file: "face-rules.json", title: "面相词条", description: "面相特征规则（非识图时备用）" },
  { id: "palm-rules", file: "palm-rules.json", title: "手相词条", description: "手相纹路规则（非识图时备用）" },
  { id: "mbti-compat", file: "mbti-compat.json", title: "MBTI 配对", description: "MBTI 类型配对分数" },
  { id: "hexagrams", file: "hexagrams.json", title: "六十四卦", description: "周易卦辞与详解知识库" },
];

const contentDir = () => path.join(process.cwd(), "content");

type CacheEntry = { mtimeMs: number; data: unknown };
const cache = new Map<string, CacheEntry>();

export function getContentMeta(id: string): ContentFileMeta | undefined {
  return CONTENT_CATALOG.find((c) => c.id === id);
}

export function resolveContentPath(file: string): string {
  const base = path.resolve(contentDir());
  const full = path.resolve(base, file);
  if (!full.startsWith(base + path.sep) && full !== base) {
    throw new Error("非法内容路径");
  }
  return full;
}

export function loadContentJson<T = unknown>(file: string): T {
  const full = resolveContentPath(file);
  const stat = fs.statSync(full);
  const cached = cache.get(file);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.data as T;
  }
  const data = JSON.parse(fs.readFileSync(full, "utf8")) as T;
  cache.set(file, { mtimeMs: stat.mtimeMs, data });
  return data;
}

export function readContentRaw(id: string): { meta: ContentFileMeta; text: string; bytes: number } {
  const meta = getContentMeta(id);
  if (!meta) throw new Error("未知内容文件");
  const full = resolveContentPath(meta.file);
  const text = fs.readFileSync(full, "utf8");
  return { meta, text, bytes: Buffer.byteLength(text, "utf8") };
}

export function writeContentRaw(id: string, text: string): { meta: ContentFileMeta; bytes: number } {
  const meta = getContentMeta(id);
  if (!meta) throw new Error("未知内容文件");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSON 格式无效，请检查后再保存");
  }
  const normalized = `${JSON.stringify(parsed, null, 2)}\n`;
  const full = resolveContentPath(meta.file);
  fs.writeFileSync(full, normalized, "utf8");
  cache.delete(meta.file);
  cache.set(meta.file, { mtimeMs: fs.statSync(full).mtimeMs, data: parsed });
  return { meta, bytes: Buffer.byteLength(normalized, "utf8") };
}

export function listContentFiles() {
  return CONTENT_CATALOG.map((meta) => {
    const full = resolveContentPath(meta.file);
    const stat = fs.statSync(full);
    return {
      ...meta,
      bytes: stat.size,
      updatedAt: stat.mtime.toISOString(),
    };
  });
}
