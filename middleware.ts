import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** 仅这些页面强制登录；其余页面游客可浏览 */
const AUTH_REQUIRED_PREFIXES = ["/profiles", "/reports", "/onboarding", "/recharge"];

const PUBLIC_API = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/init",
  "/api/og",
  "/api/wechat/",
];

const CRAWLER_UA =
  /MicroMessenger|facebookexternalhit|Twitterbot|Slackbot|WhatsApp|LinkedInBot|bingbot/i;

function isCrawler(request: NextRequest): boolean {
  return CRAWLER_UA.test(request.headers.get("user-agent") ?? "");
}

function withPathnameHeader(request: NextRequest, response: NextResponse) {
  response.headers.set("x-pathname", request.nextUrl.pathname);
  return response;
}

function requiresAuthPage(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getToken(request: NextRequest): string | null {
  return (
    request.cookies.get("user_token")?.value ??
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.slice(7)
      : null)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      return withPathnameHeader(request, NextResponse.next());
    }
    const adminTok = request.cookies.get("admin_token")?.value;
    if (!adminTok) {
      const loginUrl = new URL("/admin/login", request.nextUrl);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return withPathnameHeader(request, NextResponse.next());
  }

  if (pathname.startsWith("/api/admin")) {
    // login / session check stay public; other admin APIs enforce auth in handlers
    return withPathnameHeader(request, NextResponse.next());
  }

  if (PUBLIC_API.some((p) => pathname === p || pathname.startsWith(p))) {
    return withPathnameHeader(request, NextResponse.next());
  }

  if (request.method === "GET" && isCrawler(request)) {
    return withPathnameHeader(request, NextResponse.next());
  }

  const token = getToken(request);

  if (pathname.startsWith("/api/")) {
    // 测算等 API 仍需登录；公开 API 已在上方放行
    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return withPathnameHeader(request, NextResponse.next());
  }

  // 页面：仅保护档案/历史/充值等；首页与模块页游客可进
  if (requiresAuthPage(pathname) && !token) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const res = withPathnameHeader(request, NextResponse.next());
  // HTML 禁止被中间层长期缓存（SW 污染后更易恢复）
  if (!pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return res;
}

export const config = {
  matcher: [
    /*
     * 排除静态资源与 PWA 清单，避免 /manifest.webmanifest 被重定向到
     * /login?from=/manifest.webmanifest 导致无限刷新。
     */
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|clear-sw\\.js|manifest\\.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
