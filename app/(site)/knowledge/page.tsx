import type { Metadata } from "next";
import Link from "next/link";
import { getModuleDefinition } from "@/lib/hub/module-registry";
import { chunksByModule } from "@/lib/seo/knowledge-content";

export const metadata: Metadata = {
  title: "命理知识库",
  description:
    "八字、紫微、易经、六爻、黄历、姓名等传统术数知识条目汇编，由易道命理整理，免费在线阅读。",
  openGraph: {
    title: "命理知识库 · 易道命理",
    description: "传统术数知识条目汇编，免费在线阅读。",
    url: "/knowledge",
  },
};

export default function KnowledgeIndexPage() {
  const groups = chunksByModule();
  const total = groups.reduce((n, g) => n + g.chunks.length, 0);

  return (
    <div className="page-container page-container--knowledge">
      <header className="page-header">
        <p className="page-eyebrow">命理知识库</p>
        <h1>术数知识条目汇编</h1>
        <p className="page-desc">
          共 {total} 条知识条目，覆盖 {groups.length} 个术数模块的义理基础，供学习参考。
        </p>
        <div className="page-header-line" aria-hidden />
      </header>

      {groups.map(({ module: moduleId, chunks }) => {
        const mod = getModuleDefinition(moduleId);
        return (
          <section key={moduleId} className="kb-group">
            <h2 className="kb-group-title">
              {mod ? (
                <Link href={mod.path} className="kb-group-link">
                  {mod.name}
                  <span className="kb-group-cat">{mod.category}</span>
                </Link>
              ) : (
                moduleId
              )}
            </h2>
            <ul className="kb-list">
              {chunks.map((c) => (
                <li key={c.title} className="kb-item">
                  <Link
                    href={`/knowledge/${encodeURIComponent(`${moduleId}-${c.title}`)}`}
                    className="kb-item-link"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
