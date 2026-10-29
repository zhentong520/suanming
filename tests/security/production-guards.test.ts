import { describe, expect, it, afterEach } from "vitest";
import {
  assertProductionSecrets,
  authCookieSecure,
  jwtSecretLooksWeak,
  adminPasswordLooksDefault,
} from "@/lib/security/production-guards";

describe("production guards", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env.NODE_ENV = prev.NODE_ENV;
    process.env.JWT_SECRET = prev.JWT_SECRET;
    process.env.ADMIN_PASSWORD = prev.ADMIN_PASSWORD;
    process.env.STRICT_PROD_SECRETS = prev.STRICT_PROD_SECRETS;
    process.env.AUTH_COOKIE_SECURE = prev.AUTH_COOKIE_SECURE;
  });

  it("detects weak jwt and default admin password", () => {
    expect(jwtSecretLooksWeak("change-me-in-production")).toBe(true);
    expect(jwtSecretLooksWeak("short")).toBe(true);
    expect(jwtSecretLooksWeak("a-sufficiently-long-random-secret")).toBe(false);
    expect(adminPasswordLooksDefault("admin123")).toBe(true);
    expect(adminPasswordLooksDefault("CorrectHorseBattery")).toBe(false);
  });

  it("enables secure cookies in production by default", () => {
    process.env.AUTH_COOKIE_SECURE = undefined;
    process.env.NODE_ENV = "production";
    expect(authCookieSecure()).toBe(true);
    process.env.NODE_ENV = "development";
    expect(authCookieSecure()).toBe(false);
    process.env.AUTH_COOKIE_SECURE = "true";
    expect(authCookieSecure()).toBe(true);
  });

  it("throws when STRICT_PROD_SECRETS and weak secrets in production", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "change-me-in-production";
    process.env.ADMIN_PASSWORD = "admin123";
    process.env.STRICT_PROD_SECRETS = "true";
    expect(() => assertProductionSecrets()).toThrow(/密钥不合规/);
  });
});
