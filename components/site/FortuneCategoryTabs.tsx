"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useLocale } from "@/components/site/LocaleProvider";

const CATEGORY_META: Record<string, { color: string; glyph: string }> = {
  命: { color: "cat-ming", glyph: "命" },
  卜: { color: "cat-bu", glyph: "卜" },
  相: { color: "cat-xiang", glyph: "相" },
  术: { color: "cat-shu", glyph: "术" },
};

type ModuleItem = {
  id: string;
  name: string;
  path: string;
  category: string;
  description?: string;
  implemented?: boolean;
};

export function FortuneCategoryTabs({ items }: { items: ModuleItem[] }) {
  const { t } = useLocale();
  const categories = useMemo(() => {
    const cats = ["命", "卜", "相", "术"].filter((c) => items.some((i) => i.category === c));
    return ["全部", ...cats] as const;
  }, [items]);

  const [active, setActive] = useState<string>("全部");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && categories.includes(hash as (typeof categories)[number])) {
      setActive(hash);
    }
  }, [categories]);

  const filtered = active === "全部" ? items : items.filter((i) => i.category === active);

  const handleTab = (cat: string) => {
    setActive(cat);
    if (cat !== "全部") {
      window.history.replaceState(null, "", `#${cat}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const labelFor = (cat: string) => (cat === "全部" ? t("nav.all") : t(`cat.${cat}`));
  const descFor = (cat: string) => (cat === "全部" ? "" : t(`cat.${cat}.desc`));

  return (
    <div className="fortune-tabs-wrap">
      <div className="fortune-tabs" role="tablist" aria-label={t("nav.modules")}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            role="tab"
            aria-selected={active === cat}
            className={clsx(
              "fortune-tab",
              active === cat && "fortune-tab--active",
              cat !== "全部" && CATEGORY_META[cat]?.color
            )}
            onClick={() => handleTab(cat)}
          >
            <span className="fortune-tab-label">{labelFor(cat)}</span>
          </button>
        ))}
      </div>

      {active !== "全部" && CATEGORY_META[active] && (
        <p className={clsx("fortune-tab-desc", CATEGORY_META[active].color)}>
          {descFor(active)} · {filtered.length}
        </p>
      )}

      <div className="fortune-grid" role="tabpanel">
        {filtered.map((item) => (
          <FortuneItem key={item.id} item={item} categoryLabel={t(`cat.${item.category}`)} />
        ))}
      </div>
    </div>
  );
}

function FortuneItem({ item, categoryLabel }: { item: ModuleItem; categoryLabel: string }) {
  const meta = CATEGORY_META[item.category];
  return (
    <a
      href={item.path}
      className={clsx("fortune-item", meta?.color, !item.implemented && "fortune-item-disabled")}
    >
      <span className="fortune-item-glyph">{meta?.glyph ?? "·"}</span>
      <span className="fortune-category">{categoryLabel}</span>
      <span className="fortune-name">{item.name}</span>
      {item.description ? <span className="fortune-item-desc">{item.description}</span> : null}
      <span className="fortune-item-arrow">→</span>
    </a>
  );
}

export { CATEGORY_META };
