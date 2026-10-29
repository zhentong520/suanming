type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
/** 容量上限：防止伪造 IP 无限撑大内存 */
const MAX_BUCKETS = 10_000;
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = 0;

function sweepExpired(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(k);
  }
}

function enforceCapacity(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  // 先清过期，仍超限则按插入顺序淘汰最旧条目
  for (const [k, b] of buckets) {
    if (now >= b.resetAt) buckets.delete(k);
    if (buckets.size <= MAX_BUCKETS) return;
  }
  while (buckets.size > MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) return;
    buckets.delete(oldest);
  }
}

/** Simple sliding-window counter (in-memory; single-process). */
export function checkRateLimit(key: string, limit: number, windowMs: number): {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  sweepExpired(now);
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    enforceCapacity(now);
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

/**
 * 以客户端 IP 作为限流键。
 * 转发头（x-forwarded-for / x-real-ip）可被客户端伪造，仅在部署于可信反向代理之后时
 * 才能用于取真实 IP；直连部署请设置 TRUST_PROXY_HEADERS=false，此时所有匿名请求
 * 共享 local 键（攻击者无法换 IP 绕过，代价是限流粒度变粗）。
 */
export function clientKeyFromRequest(request: Request, suffix: string): string {
  if (process.env.TRUST_PROXY_HEADERS === "false") {
    return `local:${suffix}`;
  }
  const fwd = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = fwd || realIp || "local";
  return `${ip}:${suffix}`;
}

/** Auth endpoints: tighter limits (per IP). Multi-instance: replace with Redis later. */
export const AUTH_RATE = {
  login: { limit: 20, windowMs: 60_000 },
  register: { limit: 10, windowMs: 60_000 },
  adminLogin: { limit: 10, windowMs: 60_000 },
} as const;

export function resetRateLimitBuckets() {
  buckets.clear();
}
