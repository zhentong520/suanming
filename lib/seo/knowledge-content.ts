/** 知识库静态内容（SEO 内容矩阵）：从种子 JSON 构建文章页，构建期生成、无需数据库 */
import seed from "@/content/knowledge-seed.json";

export interface KnowledgeChunk {
  module: string;
  title: string;
  body: string;
}

export const KNOWLEDGE_CHUNKS: KnowledgeChunk[] = (seed as { chunks: KnowledgeChunk[] }).chunks;

export const KNOWLEDGE_VERSION =
  (seed as unknown as { version?: string; description?: string }).version ?? "1";

/** slug 形如 bazi-五行生克总纲：模块前缀保证唯一 */
export function knowledgeSlug(chunk: KnowledgeChunk): string {
  return `${chunk.module}-${chunk.title}`;
}

export function findKnowledgeChunk(slug: string): KnowledgeChunk | undefined {
  // Next 动态路由参数可能保持 URL 编码态，做一次幂等解码（容忍非法编码）
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    /* 原样使用 */
  }
  return (
    KNOWLEDGE_CHUNKS.find((c) => `${c.module}-${c.title}` === decoded) ??
    KNOWLEDGE_CHUNKS.find((c) => `${c.module}-${c.title}` === slug)
  );
}

/** 同模块的其他条目（用于相关阅读） */
export function siblingChunks(chunk: KnowledgeChunk): KnowledgeChunk[] {
  return KNOWLEDGE_CHUNKS.filter((c) => c.module === chunk.module && c !== chunk);
}

/** 按模块分组（用于知识库首页） */
export function chunksByModule(): Array<{ module: string; chunks: KnowledgeChunk[] }> {
  const map = new Map<string, KnowledgeChunk[]>();
  for (const c of KNOWLEDGE_CHUNKS) {
    const list = map.get(c.module) ?? [];
    list.push(c);
    map.set(c.module, list);
  }
  return [...map.entries()].map(([module, chunks]) => ({ module, chunks }));
}
