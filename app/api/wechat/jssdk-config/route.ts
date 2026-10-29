import { createHash, randomUUID } from "crypto";
import { getSessionFromRequest } from "@/lib/user/auth";

const TOKEN_CACHE = { token: "", expires: 0 };
const TICKET_CACHE = { ticket: "", expires: 0 };

async function fetchAccessToken(appId: string, secret: string): Promise<string> {
  if (TOKEN_CACHE.token && Date.now() < TOKEN_CACHE.expires) {
    return TOKEN_CACHE.token;
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`;
  const res = await fetch(url, { next: { revalidate: 7000 } });
  const data = (await res.json()) as { access_token?: string; expires_in?: number; errcode?: number };
  if (!data.access_token) {
    // 细节只进服务端日志，不透传给客户端
    console.error("[suanming:wechat] access_token 获取失败:", JSON.stringify(data));
    throw new Error("access_token");
  }
  TOKEN_CACHE.token = data.access_token;
  TOKEN_CACHE.expires = Date.now() + (data.expires_in ?? 7200) * 1000 - 60_000;
  return data.access_token;
}

async function fetchJsApiTicket(token: string): Promise<string> {
  if (TICKET_CACHE.ticket && Date.now() < TICKET_CACHE.expires) {
    return TICKET_CACHE.ticket;
  }
  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`;
  const res = await fetch(url, { next: { revalidate: 7000 } });
  const data = (await res.json()) as { ticket?: string; expires_in?: number; errcode?: number };
  if (!data.ticket) {
    console.error("[suanming:wechat] jsapi_ticket 获取失败:", JSON.stringify(data));
    throw new Error("jsapi_ticket");
  }
  TICKET_CACHE.ticket = data.ticket;
  TICKET_CACHE.expires = Date.now() + (data.expires_in ?? 7200) * 1000 - 60_000;
  return data.ticket;
}

function signTicket(ticket: string, url: string) {
  const nonceStr = randomUUID().replace(/-/g, "").slice(0, 16);
  const timestamp = Math.floor(Date.now() / 1000);
  const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  const signature = createHash("sha1").update(raw).digest("hex");
  return { nonceStr, timestamp, signature };
}

/** 校验待签名 URL 属于本站域名，防止为任意第三方页面生成 JSSDK 签名 */
function isAllowedPageUrl(pageUrl: string, requestHost: string | null): boolean {
  let host: string | null = null;
  try {
    host = new URL(pageUrl).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  if (requestHost) allowed.add(requestHost);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      allowed.add(new URL(siteUrl).host);
    } catch {
      /* ignore */
    }
  }
  for (const h of (process.env.WECHAT_JSSDK_ALLOWED_HOSTS ?? "").split(",")) {
    if (h.trim()) allowed.add(h.trim());
  }
  return allowed.has(host);
}

export async function GET(request: Request) {
  const appId = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;

  if (!appId || !secret) {
    return Response.json(
      { enabled: false, error: "未配置 WECHAT_APP_ID / WECHAT_APP_SECRET" },
      { status: 503 }
    );
  }

  // 需登录：防止未登录方刷微信接口配额
  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageUrl = searchParams.get("url");
  if (!pageUrl) {
    return Response.json({ error: "缺少 url 参数" }, { status: 400 });
  }
  if (!isAllowedPageUrl(pageUrl, request.headers.get("host"))) {
    return Response.json({ error: "url 不属于本站域名" }, { status: 400 });
  }

  try {
    const token = await fetchAccessToken(appId, secret);
    const ticket = await fetchJsApiTicket(token);
    const { nonceStr, timestamp, signature } = signTicket(ticket, pageUrl.split("#")[0]);

    return Response.json({
      enabled: true,
      appId,
      timestamp,
      nonceStr,
      signature,
    });
  } catch (e) {
    console.error("[suanming:wechat] jssdk 签名失败:", e);
    return Response.json(
      { enabled: false, error: "签名服务暂不可用，请稍后重试" },
      { status: 500 }
    );
  }
}
