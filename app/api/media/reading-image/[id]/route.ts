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
  const meta = await getReadingImage(session.userId, id);
  if (!meta) {
    return NextResponse.json({ error: "图片不存在" }, { status: 404 });
  }

  const buffer = await readImageBuffer(meta);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": meta.mimeType,
      // mimeType 来自服务端嗅探，仍加 nosniff 双保险
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
