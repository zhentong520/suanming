import { NextResponse } from "next/server";
import { ensureSeeded } from "../../../init/route";
import { requireUser, isAuthError } from "@/lib/user/profiles";
import { createShareToken, getShareTokenStatus, revokeShareToken } from "@/lib/user/share";

function baseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && /^https?:\/\//.test(envUrl)) return envUrl.replace(/\/$/, "");
  return new URL(request.url).origin;
}

async function resolveReportId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return id;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const reportId = await resolveReportId(params);
  const token = await getShareTokenStatus(session.userId, reportId);
  return NextResponse.json({
    token,
    url: token ? `${baseUrl(request)}/s/${token}` : null,
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const reportId = await resolveReportId(params);
  try {
    const token = await createShareToken(session.userId, reportId);
    return NextResponse.json({ token, url: `${baseUrl(request)}/s/${token}` });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "生成失败" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;
  const reportId = await resolveReportId(params);
  await revokeShareToken(session.userId, reportId);
  return NextResponse.json({ ok: true });
}
