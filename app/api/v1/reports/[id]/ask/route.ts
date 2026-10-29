import { NextResponse } from "next/server";
import { ensureSeeded } from "../../../../init/route";
import { isAuthError, requireUser } from "@/lib/user/profiles";
import { askReport, listReportMessages } from "@/lib/user/report-chat";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/security/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const { id } = await params;
  const messages = await listReportMessages(session.userId, id);
  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const rate = checkRateLimit(clientKeyFromRequest(request, `ask:${session.userId}`), 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `提问太频繁，请 ${rate.retryAfterSec} 秒后再试` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const { id } = await params;
  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question : "";
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const result = await askReport({ userId: session.userId, reportId: id, question });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "追问失败" }, { status: 400 });
  }
  return NextResponse.json({ answer: result.answer });
}
