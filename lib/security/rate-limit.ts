type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Simple sliding-window counter (in-memory; single-process). */
export function checkRateLimit(key: string, limit: number, windowMs: number): {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
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

export function clientKeyFromRequest(request: Request, suffix: string): string {
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
