import { NextResponse } from "next/server";
import { getReadingImage, readImageBuffer } from "@/lib/media/reading-image";
import { isAuthError, requireUser } from "@/lib/user/profiles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const { id } = await params;
  const meta = getReadingImage(session.userId, id);
  if (!meta) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }

  const buffer = readImageBuffer(meta);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": meta.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
