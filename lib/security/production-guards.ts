/**
 * Production secret / cookie helpers.
 */

const WEAK_JWT = new Set(["", "change-me-in-production", "dev-secret", "changeme"]);

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function jwtSecretLooksWeak(secret = process.env.JWT_SECRET ?? ""): boolean {
  const s = secret.trim();
  return !s || WEAK_JWT.has(s) || s.length < 16;
}

export function adminPasswordLooksDefault(password = process.env.ADMIN_PASSWORD ?? "admin123"): boolean {
  return password === "admin123" || password === "admin" || password.length < 8;
}

/**
 * 统一解析 JWT_SECRET：
 * - 未配置或弱密钥时，生产环境直接抛错拒绝服务（防伪造 token）；
 * - 开发环境回退 dev-secret 以保持本地开发体验。
 */
export function resolveJwtSecret(): string {
  const s = (process.env.JWT_SECRET ?? "").trim();
  if (s && !jwtSecretLooksWeak(s)) return s;
  if (isProductionRuntime()) {
    throw new Error(
      "[suanming:security] JWT_SECRET 未配置或过弱，拒绝签发/校验令牌。请设置至少 16 位的强随机密钥。"
    );
  }
  return "dev-secret";
}

/** User session cookies should be Secure on HTTPS production. */
export function authCookieSecure(): boolean {
  if (process.env.AUTH_COOKIE_SECURE === "true") return true;
  if (process.env.AUTH_COOKIE_SECURE === "false") return false;
  return isProductionRuntime();
}

/**
 * Log (and optionally throw) when production runs with default secrets.
 * Set STRICT_PROD_SECRETS=true to refuse boot/seed.
 */
export function assertProductionSecrets(): { ok: boolean; warnings: string[] } {
  if (!isProductionRuntime()) {
    return { ok: true, warnings: [] };
  }

  const warnings: string[] = [];
  if (jwtSecretLooksWeak()) {
    warnings.push(
      "JWT_SECRET 过弱或为默认值（change-me-in-production / 过短）。生产环境必须更换为足够长的随机串。"
    );
  }
  if (adminPasswordLooksDefault()) {
    warnings.push(
      "ADMIN_PASSWORD 仍为默认或过短。请设置强密码，并在后台「系统设置」中修改管理员密码。"
    );
  }

  for (const w of warnings) {
    console.error(`[suanming:security] ${w}`);
  }

  if (warnings.length && process.env.STRICT_PROD_SECRETS === "true") {
    throw new Error(`生产环境密钥不合规：\n- ${warnings.join("\n- ")}`);
  }

  return { ok: warnings.length === 0, warnings };
}
