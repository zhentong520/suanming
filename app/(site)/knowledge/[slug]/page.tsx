import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModuleDefinition } from "@/lib/hub/module-registry";
import {
  KNOWLEDGE_CHUNKS,
  findKnowledgeChunk,
  siblingChunks,
} from "@/lib/seo/knowledge-content";
import {
  buildKnowledgeArticleJsonLd,
  buildKnowledgeBreadcrumbJsonLd,
} from "@/lib/seo/jsonld";

export function generateStaticParams(): Array<{ slug: string }> {
  return KNOWLEDGE_CHUNKS.map((c) => ({ slug: `${c.module}-${c.title}` }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const chunk = findKnowledgeChunk(slug);
  if (!chunk) return { title: "条目未找到" };
  const mod = getModuleDefinition(chunk.module);
  const modName = mod?.name ?? chunk.module;
  const title = `${chunk.title} · ${modName}`;
  return {
    title,
    description: chunk.body.slice(0, 120),
    openGraph: {
      title: `${title} · 易道命理`,
      description: chunk.body.slice(0, 120),
      url: `/knowledge/${encodeURIComponent(slug)}`,
    },
  };
}

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chunk = findKnowledgeChunk(slug);
  if (!chunk) notFound();

  const mod = getModuleDefinition(chunk.module);
  const modName = mod?.name ?? chunk.module;
  const siblings = siblingChunks(chunk);
  const paragraphs = chunk.body.split(/\n+/).filter(Boolean);

  return (
    <div className="page-container page-container--knowledge">
      <header className="page-header">
        <p className="page-eyebrow">命理知识库 · {modName}</p>
        <h1>{chunk.title}</h1>
        <div className="page-header-line" aria-hidden />
      </header>

      <article className="kb-article report-section">
        <div className="report-section-body">
          {paragraphs.map((p, i) => (
            <p key={i} className="kb-paragraph">
              {p}
            </p>
          ))}
        </div>
        <div className="kb-article-actions">
          {mod ? (
            <Link href={mod.path} className="kb-cta">
              前往「{modName}」在线测算 →
            </Link>
          ) : null}
        </div>
      </article>

      {siblings.length ? (
        <section className="kb-group">
          <h2 className="kb-group-title">{modName} · 相关条目</h2>
          <ul className="kb-list">
            {siblings.map((s) => (
              <li key={s.title} className="kb-item">
                <Link
                  href={`/knowledge/${encodeURIComponent(`${chunk.module}-${s.title}`)}`}
                  className="kb-item-link"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="disclaimer">以上内容整理自传统术数典籍，仅供文化学习与娱乐参考。</p>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildKnowledgeArticleJsonLd({ slug, module: chunk.module, title: chunk.title, body: chunk.body })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildKnowledgeBreadcrumbJsonLd(modName, slug)) }}
      />
    </div>
  );
}
