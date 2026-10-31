import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createHash } from "crypto";
import { verifyCallbackUrl, parseCallbackOrderRef } from "@/lib/wechat/mini-callback";

const TOKEN = "test-callback-token";

function signedQuery(nonce = "nonce1", echostr = "echo-123"): URLSearchParams {
  const timestamp = "1700000000";
  const signature = createHash("sha1")
    .update([TOKEN, timestamp, nonce].sort().join(""), "utf8")
    .digest("hex");
  return new URLSearchParams({ signature, timestamp, nonce, echostr });
}

beforeAll(() => {
  process.env.WX_MINI_CALLBACK_TOKEN = TOKEN;
});

afterAll(() => {
  delete process.env.WX_MINI_CALLBACK_TOKEN;
});

describe("wechat message-push callback protocol", () => {
  it("GET url verification returns echostr on valid signature", () => {
    expect(verifyCallbackUrl(signedQuery())).toBe("echo-123");
  });

  it("GET url verification rejects bad signature", () => {
    const q = signedQuery();
    q.set("signature", "deadbeef");
    expect(verifyCallbackUrl(q)).toBeNull();
  });

  it("parses JSON event body (xpay_goods_deliver_notify style)", () => {
    const ref = parseCallbackOrderRef(
      JSON.stringify({
        Event: "xpay_goods_deliver_notify",
        OpenId: "o-xyz",
        OutTradeNo: "ali_test_1",
        WxOrderId: "wx-1",
      })
    );
    expect(ref?.outTradeNo).toBe("ali_test_1");
    expect(ref?.wxOrderId).toBe("wx-1");
    expect(ref?.openid).toBe("o-xyz");
    expect(ref?.event).toBe("xpay_goods_deliver_notify");
  });

  it("parses XML event body fallback", () => {
    const ref = parseCallbackOrderRef(
      "<xml><Event><![CDATA[xpay_goods_deliver_notify]]></Event><OutTradeNo><![CDATA[wx_t2]]></OutTradeNo></xml>"
    );
    expect(ref?.outTradeNo).toBe("wx_t2");
    expect(ref?.event).toBe("xpay_goods_deliver_notify");
  });

  it("returns null for empty/irrelevant body", () => {
    expect(parseCallbackOrderRef("")).toBeNull();
    expect(parseCallbackOrderRef(JSON.stringify({ MsgType: "text" }))).toBeNull();
  });
});
