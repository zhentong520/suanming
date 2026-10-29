import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { saveReadingImage, type ReadingImageModule } from "@/lib/media/reading-image";
import { isAuthError, requireUser } from "@/lib/user/profiles";
import { logUserOperation } from "@/lib/user/operations";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const rate = checkRateLimit(clientKeyFromRequest(request, `upload:${session.userId}`), 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `上传过于频繁，请 ${rate.retryAfterSec} 秒后再试` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  try {
    const form = await request.formData();
    const module = String(form.get("module") ?? "") as ReadingImageModule;
    const file = form.get("file");

    if (module !== "face" && module !== "palm") {
      return NextResponse.json({ error: "module 须为 face 或 palm" }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
    }

    const saved = await saveReadingImage(session.userId, module, file);

    await logUserOperation({
      userId: session.userId,
      action: "upload_reading_image",
      moduleId: module,
      metadata: { imageId: saved.id },
    });

    return NextResponse.json({
      id: saved.id,
      module: saved.module,
      previewUrl: `/api/media/reading-image/${saved.id}`,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "上传失败" }, { status: 400 });
  }
}
