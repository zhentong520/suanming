import clsx from "clsx";
import { CloudPattern } from "./Decorations";

const CATEGORY_META: Record<string, { color: string; glyph: string; desc: string }> = {
  命: { color: "cat-ming", glyph: "命", desc: "观命之理" },
  卜: { color: "cat-bu", glyph: "卜", desc: "决疑问卦" },
  相: { color: "cat-xiang", glyph: "相", desc: "察形知意" },
  术: { color: "cat-shu", glyph: "术", desc: "日用术数" },
};

export function ScrollCard({
  children,
  className,
  title,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  variant?: "default" | "report" | "hero";
}) {
  return (
    <div className={clsx("scroll-card", `scroll-card--${variant}`, className)}>
      <div className="scroll-roller scroll-roller--top" aria-hidden />
      {title && (
        <div className="scroll-card-header">
          <CloudPattern className="scroll-card-cloud" />
          <h3 className="scroll-card-title">{title}</h3>
          <CloudPattern className="scroll-card-cloud scroll-card-cloud--flip" />
        </div>
      )}
      <div className="scroll-card-body">{children}</div>
      <div className="scroll-roller scroll-roller--bottom" aria-hidden />
    </div>
  );
}

export function SealBadge({
  children,
  variant = "red",
}: {
  children: React.ReactNode;
  variant?: "red" | "gold" | "jade";
}) {
  return (
    <span
      className={clsx(
        "seal-badge",
        variant === "gold" && "seal-gold",
        variant === "jade" && "seal-jade",
        variant === "red" && "seal-red"
      )}
    >
      {children}
    </span>
  );
}

export function InkDivider() {
  return <div className="ink-divider" />;
}

export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="section-heading">
      <h2 className="section-heading-title">{title}</h2>
      {subtitle && <p className="section-heading-sub">{subtitle}</p>}
      <div className="section-heading-line" aria-hidden />
    </div>
  );
}

export function FortuneGrid({
  items,
}: {
  items: Array<{
    id: string;
    name: string;
    path: string;
    category: string;
    implemented?: boolean;
  }>;
}) {
  const grouped = ["命", "卜", "相", "术"]
    .map((cat) => ({
      cat,
      meta: CATEGORY_META[cat],
      items: items.filter((i) => i.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  if (grouped.length <= 1 && items.length > 0) {
    return (
      <div className="fortune-grid">
        {items.map((item) => (
          <FortuneItem key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="fortune-groups">
      {grouped.map(({ cat, meta, items: catItems }) => (
        <div key={cat} className="fortune-group">
          <div className={clsx("fortune-group-label", meta?.color)}>
            <span className="fortune-group-glyph">{meta?.glyph ?? cat}</span>
            <span className="fortune-group-desc">{meta?.desc}</span>
          </div>
          <div className="fortune-grid">
            {catItems.map((item) => (
              <FortuneItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FortuneItem({
  item,
}: {
  item: {
    id: string;
    name: string;
    path: string;
    category: string;
    implemented?: boolean;
  };
}) {
  const meta = CATEGORY_META[item.category];
  return (
    <a
      href={item.path}
      className={clsx(
        "fortune-item",
        meta?.color,
        !item.implemented && "fortune-item-disabled"
      )}
    >
      <span className="fortune-item-glyph">{meta?.glyph ?? "·"}</span>
      <span className="fortune-category">{item.category}</span>
      <span className="fortune-name">{item.name}</span>
      <span className="fortune-item-arrow">→</span>
    </a>
  );
}

export function ReportPanel({
  report,
  aiReport,
}: {
  report: string;
  aiReport?: string;
}) {
  const sections = parseReportSections(report);

  return (
    <div className="report-panel">
      {sections.map((sec, i) => (
        <div key={i} className={clsx("report-section", sec.isHeader && "report-section--header")}>
          {sec.title ? (
            <>
              <h4 className="report-section-title">{sec.title}</h4>
              {sec.content && <div className="report-section-body">{sec.content}</div>}
            </>
          ) : (
            <div className="report-section-body">{sec.content}</div>
          )}
        </div>
      ))}
      {aiReport && (
        <>
          <InkDivider />
          <h4 className="report-ai-title">
            AI 解读
            <span className="report-ai-badge">AI 生成 · 仅供文化娱乐参考</span>
          </h4>
          <div className="report-section-body report-ai-body">{aiReport}</div>
        </>
      )}
    </div>
  );
}

function parseReportSections(text: string) {
  const lines = text.split("\n");
  const sections: Array<{ title?: string; content: string; isHeader?: boolean }> = [];
  let current: { title?: string; content: string[]; isHeader?: boolean } | null = null;

  for (const line of lines) {
    const headerMatch = line.match(/^【(.+?)】$/);
    const sectionMatch = line.match(/^▎(.+)$/);

    if (headerMatch) {
      if (current) sections.push({ ...current, content: current.content.join("\n").trim() });
      current = { title: headerMatch[1], content: [], isHeader: true };
    } else if (sectionMatch) {
      if (current) sections.push({ ...current, content: current.content.join("\n").trim() });
      current = { title: sectionMatch[1], content: [] };
    } else if (line.startsWith("※") || line.startsWith("综合评分")) {
      if (current) sections.push({ ...current, content: current.content.join("\n").trim() });
      current = { content: [line] };
    } else {
      if (!current) current = { content: [] };
      current.content.push(line);
    }
  }
  if (current) sections.push({ ...current, content: current.content.join("\n").trim() });

  return sections.filter((s) => s.content || s.title);
}
