import { createHash } from "crypto";

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
    throw new Error(`微信 access_token 失败: ${JSON.stringify(data)}`);
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
    throw new Error(`微信 jsapi_ticket 失败: ${JSON.stringify(data)}`);
  }
  TICKET_CACHE.ticket = data.ticket;
  TICKET_CACHE.expires = Date.now() + (data.expires_in ?? 7200) * 1000 - 60_000;
  return data.ticket;
}

function signTicket(ticket: string, url: string) {
  const nonceStr = Math.random().toString(36).slice(2, 12);
  const timestamp = Math.floor(Date.now() / 1000);
  const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  const signature = createHash("sha1").update(raw).digest("hex");
  return { nonceStr, timestamp, signature };
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

  const { searchParams } = new URL(request.url);
  const pageUrl = searchParams.get("url");
  if (!pageUrl) {
    return Response.json({ error: "缺少 url 参数" }, { status: 400 });
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
    return Response.json(
      { enabled: false, error: e instanceof Error ? e.message : "签名失败" },
      { status: 500 }
    );
  }
}
