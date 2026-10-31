"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/site/ThemeProvider";

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleAmp: number;
  twinkleSpeed: number;
  phase: number;
  drift: number; // 天球漂移系数（近快远慢的视差）
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

/**
 * 夜观主题动态星空：
 * - 随机星子独立闪烁（sin 相位）+ 极缓天球漂移
 * - 随机流星划过（渐隐尾迹）
 * - prefers-reduced-motion 时退化为静态；浅色主题不渲染
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolved } = useTheme();

  useEffect(() => {
    if (resolved !== "night") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-color-scheme: reduce)") || window.matchMedia("(prefers-reduced-motion: reduce)");

    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let raf = 0;
    let width = 0;
    let height = 0;
    let running = true;
    let lastMeteorAt = 0;
    let nextMeteorDelay = 6000 + Math.random() * 9000;
    // 鼠标视差：目标偏移与当前偏移（lerp 平滑）
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function seed() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(240, Math.floor((width * height) / 6500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.4 + Math.random() * 1.3,
        baseAlpha: 0.25 + Math.random() * 0.55,
        twinkleAmp: 0.15 + Math.random() * 0.5,
        twinkleSpeed: 0.0004 + Math.random() * 0.0012,
        phase: Math.random() * Math.PI * 2,
        drift: 0.4 + Math.random() * 1.2, // 越大越"近"
      }));
    }

    function spawnMeteor(now: number) {
      lastMeteorAt = now;
      nextMeteorDelay = 8000 + Math.random() * 14000;
      const fromLeft = Math.random() > 0.5;
      const speed = 5 + Math.random() * 4;
      const angle = Math.PI * (0.12 + Math.random() * 0.14); // 斜向下
      meteors.push({
        x: fromLeft ? -30 : width + 30,
        y: Math.random() * height * 0.4,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 70 + Math.random() * 40,
      });
    }

    function frame(now: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, width, height);

      // 视差平滑逼近（最大偏移 ~26px，按星子深度分层）
      curX += (targetX - curX) * 0.04;
      curY += (targetY - curY) * 0.04;

      for (const s of stars) {
        const alpha = reduced.matches
          ? s.baseAlpha
          : Math.max(0.05, s.baseAlpha + Math.sin(now * s.twinkleSpeed + s.phase) * s.twinkleAmp);
        const px = s.x + curX * s.drift;
        const py = s.y + curY * s.drift;
        ctx!.beginPath();
        ctx!.arc(px, py, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(227, 193, 134, ${alpha.toFixed(3)})`;
        ctx!.fill();
        if (!reduced.matches) {
          // 天球漂移：缓慢向东南移动，越界回绕
          s.x += s.drift * 0.02;
          s.y += s.drift * 0.008;
          if (s.x > width + 2) s.x = -2;
          if (s.y > height + 2) s.y = -2;
        }
      }

      // 亮星光晕（少量大星）
      for (const s of stars) {
        if (s.r > 1.45) {
          const px = s.x + curX * s.drift;
          const py = s.y + curY * s.drift;
          const g = ctx!.createRadialGradient(px, py, 0, px, py, s.r * 6);
          g.addColorStop(0, `rgba(227, 193, 134, ${(s.baseAlpha * 0.35).toFixed(3)})`);
          g.addColorStop(1, "rgba(227, 193, 134, 0)");
          ctx!.fillStyle = g;
          ctx!.fillRect(px - s.r * 6, py - s.r * 6, s.r * 12, s.r * 12);
        }
      }

      // 流星
      if (!reduced.matches && now - lastMeteorAt > nextMeteorDelay && meteors.length < 2) {
        spawnMeteor(now);
      }
      meteors = meteors.filter((m) => m.life < m.maxLife);
      for (const m of meteors) {
        m.life += 1;
        m.x += m.vx;
        m.y += m.vy;
        const fade = 1 - m.life / m.maxLife;
        const tail = 90 * fade;
        const grad = ctx!.createLinearGradient(m.x, m.y, m.x - m.vx * (tail / 8), m.y - m.vy * (tail / 8));
        grad.addColorStop(0, `rgba(255, 244, 214, ${(0.85 * fade).toFixed(3)})`);
        grad.addColorStop(1, "rgba(255, 244, 214, 0)");
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.4;
        ctx!.beginPath();
        ctx!.moveTo(m.x, m.y);
        ctx!.lineTo(m.x - m.vx * (tail / 8), m.y - m.vy * (tail / 8));
        ctx!.stroke();
      }

      raf = requestAnimationFrame(frame);
    }

    function onMouseMove(e: MouseEvent) {
      if (reduced.matches) return;
      // 归一化到 [-1, 1]，再乘最大偏移
      targetX = (e.clientX / window.innerWidth - 0.5) * -2 * 26;
      targetY = (e.clientY / window.innerHeight - 0.5) * -2 * 18;
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    }

    seed();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", seed);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", seed);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [resolved]);

  if (resolved !== "night") return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
