"use client";

/**
 * 移植自 Magic UI (https://magicui.design, MIT License)
 * 纯 CSS/SVG 实现的轻量版本，无 motion 依赖，配色沿用站内 Token。
 */

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** 流光描边：沿卡片边框旋转的金色光弧（Magic UI BorderBeam） */
export function BorderBeam({
  duration = 7,
  size = 90,
  className = "",
}: {
  duration?: number;
  size?: number;
  className?: string;
}) {
  return (
    <>
      <span
        aria-hidden
        className={`magicui-beam ${className}`}
        style={
          {
            "--beam-duration": `${duration}s`,
            "--beam-size": `${size}%`,
          } as CSSProperties
        }
      />
      <span
        aria-hidden
        className={`magicui-beam magicui-beam--reverse ${className}`}
        style={
          {
            "--beam-duration": `${duration * 1.6}s`,
            "--beam-size": `${size}%`,
          } as CSSProperties
        }
      />
    </>
  );
}

/** 轨道环绕：符号沿圆形轨道缓慢环绕中心（Magic UI OrbitingCircles） */
export function OrbitingCircles({
  children,
  radius = 190,
  duration = 40,
  reverse = false,
  className = "",
}: {
  children: ReactNode;
  radius?: number;
  duration?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`magicui-orbit ${reverse ? "magicui-orbit--reverse" : ""} ${className}`}
      style={
        {
          "--orbit-radius": `${radius}px`,
          "--orbit-duration": `${duration}s`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

/** 数字滚动：从 0 滚动到目标值（Magic UI NumberTicker） */
export function NumberTicker({
  value,
  duration = 1400,
  className = "",
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(eased * value));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

/** 模糊入场：进入视口时模糊渐显（Magic UI BlurFade，CSS 版） */
export function BlurFade({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={`magicui-blurfade ${className}`}
      style={{ "--blur-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** 扫光按钮：按钮表面有一道周期性掠过的金色光带（Magic UI ShimmerButton） */
export function ShimmerLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`shimmer-btn ${className}`}>
      <span className="shimmer-btn__glow" aria-hidden />
      <span className="shimmer-btn__label">{children}</span>
    </Link>
  );
}
