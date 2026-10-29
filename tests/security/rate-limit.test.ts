import { describe, expect, it } from "vitest";
import { AUTH_RATE, checkRateLimit } from "@/lib/security/rate-limit";

describe("rate limit", () => {
  it("allows under the limit and blocks after", () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).ok).toBe(true);
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("exposes auth rate presets", () => {
    expect(AUTH_RATE.login.limit).toBeGreaterThan(0);
    expect(AUTH_RATE.register.limit).toBeLessThanOrEqual(AUTH_RATE.login.limit);
    expect(AUTH_RATE.adminLogin.limit).toBeGreaterThan(0);
  });
});
