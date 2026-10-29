import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { resolveJwtSecret } from "@/lib/security/production-guards";

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const secret = process.env.AI_KEY_SECRET || resolveJwtSecret();
  return createHash("sha256").update(`suanming-ai-key:${secret}`).digest();
}

/** Encrypt plaintext API key for storage. Already-encrypted values are returned as-is. */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) throw new Error("密钥不能为空");
  if (plaintext.startsWith(PREFIX)) return plaintext;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/**
 * Decrypt stored value. Legacy plaintext (no prefix) is returned unchanged
 * so existing rows keep working until re-saved.
 */
export function decryptSecret(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith(PREFIX)) return stored;

  const payload = stored.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("密钥密文格式损坏");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function isEncryptedSecret(stored: string): boolean {
  return stored.startsWith(PREFIX);
}
