"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

export type CompassNode = {
  id: string;
  name: string;
  path: string;
};

type AlmanacBrief = {
  lunarDate: string;
  shengXiao: string;
};

const TRIGRAMS = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];

/**
 * 罗盘轮盘：外圈 8 个精选术数 + 内圈 4 个 + 中心太极黄历。
 * 圈层缓慢公转（内外反向），悬停暂停；节点双层结构保证文字始终正立。
 */
export function CompassWheel({
  outer,
  inner,
  almanac,
}: {
  outer: CompassNode[];
  inner: CompassNode[];
  almanac: AlmanacBrief;
}) {
  return (
    <div className="compass" role="navigation" aria-label="术数罗盘">
      <div className="compass__ticks" aria-hidden />
      <div className="compass__trigrams" aria-hidden>
        {TRIGRAMS.map((t, i) => (
          <span
            key={t}
            className="compass__trigram"
            style={{ "--compass-i": i, "--compass-n": 8 } as CSSProperties}
          >
            <span className="compass__trigram-inner">{t}</span>
          </span>
        ))}
      </div>

      <div className="compass__ring compass__ring--outer">
        {outer.map((m, i) => (
          <Link
            key={m.id}
            href={m.path}
            className="compass__node"
            style={{ "--compass-i": i, "--compass-n": outer.length } as CSSProperties}
          >
            <span className="compass__node-inner">{m.name}</span>
          </Link>
        ))}
      </div>

      <div className="compass__ring compass__ring--inner">
        {inner.map((m, i) => (
          <Link
            key={m.id}
            href={m.path}
            className="compass__node compass__node--inner"
            style={{ "--compass-i": i, "--compass-n": inner.length } as CSSProperties}
          >
            <span className="compass__node-inner">{m.name}</span>
          </Link>
        ))}
      </div>

      <Link href="/almanac" className="compass__center">
        <span className="compass__taiji" aria-hidden>
          ☯
        </span>
        <span className="compass__date">{almanac.lunarDate}</span>
        <span className="compass__sx">{almanac.shengXiao}</span>
      </Link>
    </div>
  );
}
