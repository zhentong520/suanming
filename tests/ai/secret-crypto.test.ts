import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, isEncryptedSecret } from "@/lib/ai/secret-crypto";

describe("AI secret crypto", () => {
  it("round-trips plaintext", () => {
    const plain = "sk-test-key-12345";
    const enc = encryptSecret(plain);
    expect(isEncryptedSecret(enc)).toBe(true);
    expect(enc).not.toContain(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it("leaves legacy plaintext readable", () => {
    expect(decryptSecret("legacy-plain-key")).toBe("legacy-plain-key");
    expect(isEncryptedSecret("legacy-plain-key")).toBe(false);
  });

  it("does not double-encrypt", () => {
    const once = encryptSecret("abc");
    const twice = encryptSecret(once);
    expect(twice).toBe(once);
    expect(decryptSecret(twice)).toBe("abc");
  });
});
