/**
 * 微信小程序服务端会话：code2Session。
 * 环境变量：
 *   WX_MINI_APPID   小程序 AppID
 *   WX_MINI_SECRET  小程序 AppSecret
 * 未配置时所有能力返回明确错误，不 crash。
 */

export interface WxSession {
  openid: string;
  sessionKey: string;
  unionid?: string;
}

export function getWxMiniConfig(): { appid: string; secret: string } | null {
  const appid = process.env.WX_MINI_APPID?.trim();
  const secret = process.env.WX_MINI_SECRET?.trim();
  if (!appid || !secret) return null;
  return { appid, secret };
}

/**
 * 调用微信 jscode2session，换取 openid 与 session_key。
 * 错误码文档：https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html
 */
export async function wxCodeToSession(code: string): Promise<WxSession> {
  const cfg = getWxMiniConfig();
  if (!cfg) {
    throw new Error("服务端未配置 WX_MINI_APPID / WX_MINI_SECRET，暂不支持微信登录");
  }
  const url =
    "https://api.weixin.qq.com/sns/jscode2session" +
    `?appid=${encodeURIComponent(cfg.appid)}` +
    `&secret=${encodeURIComponent(cfg.secret)}` +
    `&js_code=${encodeURIComponent(code)}` +
    "&grant_type=authorization_code";

  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`微信会话接口请求失败(${res.status})`);
  const data = (await res.json()) as {
    errcode?: number;
    errmsg?: string;
    openid?: string;
    session_key?: string;
    unionid?: string;
  };

  if (data.errcode && data.errcode !== 0) {
    if (data.errcode === 40029) throw new Error("微信登录凭据无效，请重试");
    if (data.errcode === 45011) throw new Error("微信接口限频，请稍后再试");
    if (data.errcode === 40226) throw new Error("该用户已被微信风控，暂不能登录");
    throw new Error(`微信登录失败(${data.errcode})：${data.errmsg ?? "未知错误"}`);
  }
  if (!data.openid || !data.session_key) {
    throw new Error("微信登录返回不完整，请重试");
  }
  return { openid: data.openid, sessionKey: data.session_key, unionid: data.unionid };
}
