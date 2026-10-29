import crypto from "crypto";
import fs from "fs";
import path from "path";
import { getSqlite } from "./client";

export interface KnowledgeChunk {
  module: string | null;
  title: string;
  body: string;
}

interface SeedFile {
  chunks: Array<{ module: string; title: string; body: string }>;
}

/** 幂等建表：migrate.ts 已含 DDL，此处兜底（供测试或未跑迁移的场景） */
let schemaReady = false;
export function ensureKnowledgeSchema() {
  if (schemaReady) return;
  const sqlite = getSqlite();
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id TEXT PRIMARY KEY,
      module TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      source TEXT,
      created_at TEXT NOT NULL
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
      title, body, content='knowledge_chunks', content_rowid='rowid', tokenize='trigram'
    );
  `);
  schemaReady = true;
}

function seedFilePath() {
  const p = path.resolve(process.cwd(), "content/knowledge-seed.json");
  if (!p.startsWith(path.resolve(process.cwd()))) {
    throw new Error("知识库语料路径非法");
  }
  return p;
}

/** 导入种子语料（幂等：表为空才导入） */
export function seedKnowledge() {
  ensureKnowledgeSchema();
  const sqlite = getSqlite();
  const count = sqlite.prepare("SELECT COUNT(*) AS n FROM knowledge_chunks").get() as { n: number };
  if (count.n > 0) return;

  const file = seedFilePath();
  if (!fs.existsSync(file)) {
    console.error("[suanming:knowledge] 种子语料不存在:", file);
    return;
  }
  const seed = JSON.parse(fs.readFileSync(file, "utf-8")) as SeedFile;
  if (!Array.isArray(seed.chunks) || seed.chunks.length === 0) return;

  const insert = sqlite.prepare(
    `INSERT INTO knowledge_chunks (id, module, title, body, source, created_at)
     VALUES (?, ?, ?, ?, 'seed', ?)`
  );
  const now = new Date().toISOString();
  sqlite.transaction(() => {
    for (const c of seed.chunks) {
      if (!c?.title || !c?.body) continue;
      insert.run(crypto.randomUUID(), c.module ?? null, c.title, c.body, now);
    }
  })();
}

/** 中文无分词器：对连续片段做滑窗取样，供 trigram/打分使用 */
function sampleNgrams(text: string, n: number, max: number): string[] {
  const out = new Set<string>();
  for (const run of text.match(/[\u4e00-\u9fff]{2,}|[a-zA-Z]{3,}/g) ?? []) {
    if (run.length < n) {
      if (run.length >= 2) out.add(run);
      continue;
    }
    const grams: string[] = [];
    for (let i = 0; i + n <= run.length; i++) grams.push(run.slice(i, i + n));
    // 均匀取样，避免长句爆量
    const step = Math.max(1, Math.ceil(grams.length / max));
    for (let i = 0; i < grams.length; i += step) out.add(grams[i]);
  }
  return [...out].slice(0, max);
}

/** 中文检索：FTS5 trigram（3字滑窗）优先 + 二字滑窗 JS 打分兜底（小语料量级） */
export function searchKnowledge(
  query: string,
  opts?: { module?: string; limit?: number }
): KnowledgeChunk[] {
  ensureKnowledgeSchema();
  const sqlite = getSqlite();
  const q = (query ?? "").trim().slice(0, 200);
  if (!q) return [];
  const limit = Math.min(5, Math.max(1, opts?.limit ?? 3));

  const rows: KnowledgeChunk[] = [];
  const seen = new Set<string>();
  const push = (r: KnowledgeChunk) => {
    if (seen.has(r.title)) return;
    seen.add(r.title);
    rows.push(r);
  };

  // 1) FTS：3字滑窗短语 OR 匹配（trigram 索引，规模化后仍可用）
  const trigrams = sampleNgrams(q, 3, 8);
  if (trigrams.length > 0) {
    try {
      const stmt = sqlite.prepare(
        `SELECT c.title, c.body, c.module FROM knowledge_fts f
         JOIN knowledge_chunks c ON c.rowid = f.rowid
         WHERE knowledge_fts MATCH ? ORDER BY rank LIMIT ?`
      );
      for (const r of stmt.all(
        trigrams.map((t) => `"${t.replace(/"/g, '""')}"`).join(" OR "),
        limit * 3
      ) as KnowledgeChunk[]) {
        push(r);
      }
    } catch {
      /* MATCH 语法异常时静默走打分兜底 */
    }
  }

  // 2) 二字滑窗 JS 打分兜底（FTS 无结果或不足时；语料有量级上限保护）
  if (rows.length < limit) {
    const { n } = sqlite.prepare("SELECT COUNT(*) AS n FROM knowledge_chunks").get() as { n: number };
    if (n <= 5000) {
      const bigrams = sampleNgrams(q, 2, 10);
      if (bigrams.length > 0) {
        const all = (
          opts?.module
            ? sqlite
                .prepare("SELECT title, body, module FROM knowledge_chunks WHERE module = ? OR module IS NULL")
                .all(opts.module)
            : sqlite.prepare("SELECT title, body, module FROM knowledge_chunks").all()
        ) as KnowledgeChunk[];
        const scored = all
          .map((c) => {
            const hay = c.title + c.body;
            let score = 0;
            for (const g of bigrams) {
              if (c.title.includes(g)) score += 2;
              else if (hay.includes(g)) score += 1;
            }
            return { c, score };
          })
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score);
        for (const s of scored.slice(0, limit)) push(s.c);
      }
    }
  }

  return rows.slice(0, limit);
}

/** 组装 prompt 注入片段；无命中返回空串 */
export function buildKnowledgeContext(query: string, moduleId?: string): string {
  const chunks = searchKnowledge(query, { module: moduleId, limit: 3 });
  if (chunks.length === 0) return "";
  return chunks
    .map((c, i) => `【${i + 1}】${c.title}：${c.body}`)
    .join("\n\n")
    .slice(0, 1500);
}
