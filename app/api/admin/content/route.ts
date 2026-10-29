import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/client";
import { contentItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  listContentFiles,
  readContentRaw,
  writeContentRaw,
} from "@/lib/content/catalog";

async function requireAdmin(request: Request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function GET(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ files: listContentFiles() });
  }

  try {
    const { meta, text, bytes } = readContentRaw(id);
    return NextResponse.json({ ...meta, text, bytes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "读取失败" }, { status: 404 });
  }
}

export async function PUT(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await request.json();
  const id = String(body.id ?? "");
  const text = String(body.text ?? "");
  if (!id || !text) {
    return NextResponse.json({ error: "缺少 id 或 text" }, { status: 400 });
  }

  try {
    const { meta, bytes } = writeContentRaw(id, text);
    const db = getDb();
    const now = new Date().toISOString();
    const existing = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.key, meta.id))
      .limit(1);

    if (existing[0]) {
      await db
        .update(contentItems)
        .set({
          title: meta.title,
          body: text,
          category: "json",
          metadataJson: JSON.stringify({ file: meta.file, bytes }),
          updatedAt: now,
        })
        .where(eq(contentItems.id, existing[0].id));
    } else {
      await db.insert(contentItems).values({
        id: crypto.randomUUID(),
        category: "json",
        key: meta.id,
        title: meta.title,
        body: text,
        metadataJson: JSON.stringify({ file: meta.file, bytes }),
        updatedAt: now,
      });
    }

    return NextResponse.json({
      ok: true,
      id: meta.id,
      bytes,
      note: "已写入 content/ 并同步 content_items；引擎按文件 mtime 热加载。",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "保存失败" }, { status: 400 });
  }
}
