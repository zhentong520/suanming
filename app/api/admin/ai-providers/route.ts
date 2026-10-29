import { NextResponse } from "next/server";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { aiGlobalSettings, aiProviders } from "@/lib/db/schema";
import { getTokenFromRequest, verifyAdminToken } from "@/lib/admin/auth";
import { encryptSecret, isEncryptedSecret } from "@/lib/ai/secret-crypto";
import { VOLC_ARK_MODELS, getVolcEnvConfig } from "@/lib/ai/volc-models";
import { eq } from "drizzle-orm";

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
  if (searchParams.get("meta") === "1") {
    const volc = getVolcEnvConfig();
    return NextResponse.json({
      models: VOLC_ARK_MODELS,
      envConfigured: Boolean(volc.apiKey),
      textModel: volc.textModel,
      visionModel: volc.visionModel,
      baseUrl: volc.baseUrl,
      userQuota: volc.userQuota,
    });
  }

  const db = getDb();
  const list = await db.select().from(aiProviders);
  return NextResponse.json(
    list.map((p) => ({
      ...p,
      apiKeyEncrypted: "***",
      keyEncrypted: isEncryptedSecret(p.apiKeyEncrypted),
    }))
  );
}

export async function POST(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const body = await request.json();

  if (body.action === "sync-volc") {
    const volc = getVolcEnvConfig();
    if (!volc.apiKey) {
      return NextResponse.json(
        { error: "未配置 VOLC_ARK_API_KEY，请写入 .env.local 后重启" },
        { status: 400 }
      );
    }
    const db = getDb();
    const existing = await db.select().from(aiProviders);
    const found = existing.find(
      (p) => p.providerType === "volcengine" || p.baseUrl.includes("ark.cn-beijing.volces.com")
    );
    const encrypted = encryptSecret(volc.apiKey);
    if (found) {
      await db
        .update(aiProviders)
        .set({
          name: "火山方舟 Token Plan",
          providerType: "volcengine",
          baseUrl: volc.baseUrl,
          apiKeyEncrypted: encrypted,
          modelName: volc.textModel,
          isActive: true,
          priority: 0,
        })
        .where(eq(aiProviders.id, found.id));
    } else {
      await db.insert(aiProviders).values({
        id: crypto.randomUUID(),
        name: "火山方舟 Token Plan",
        providerType: "volcengine",
        baseUrl: volc.baseUrl,
        apiKeyEncrypted: encrypted,
        modelName: volc.textModel,
        maxTokens: 2048,
        temperature: 0.7,
        isActive: true,
        priority: 0,
        createdAt: new Date().toISOString(),
      });
    }
    await db
      .update(aiGlobalSettings)
      .set({ value: "true" })
      .where(eq(aiGlobalSettings.key, "global_ai_enabled"));
    return NextResponse.json({
      message: `已同步火山方舟：文本 ${volc.textModel} / 识图 ${volc.visionModel} @ ${volc.baseUrl}，并开启全局 AI` +
        (volc.remappedVision
          ? `（已将不兼容 Plan 的识图模型 ${volc.rawVisionModel} 自动改为 ${volc.visionModel}）`
          : ""),
    });
  }

  if (!body.apiKey || typeof body.apiKey !== "string") {
    return NextResponse.json({ error: "请填写 API Key" }, { status: 400 });
  }
  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(aiProviders).values({
    id,
    name: body.name,
    providerType: body.providerType,
    baseUrl: body.baseUrl,
    apiKeyEncrypted: encryptSecret(body.apiKey),
    modelName: body.modelName,
    maxTokens: body.maxTokens ?? 2048,
    temperature: body.temperature ?? 0.7,
    isActive: body.isActive ?? true,
    priority: body.priority ?? 0,
    createdAt: new Date().toISOString(),
  });

  if (body.providerType === "volcengine") {
    await db
      .update(aiGlobalSettings)
      .set({ value: "true" })
      .where(eq(aiGlobalSettings.key, "global_ai_enabled"));
  }

  return NextResponse.json({ id });
}

export async function DELETE(request: Request) {
  await ensureSeeded();
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  const db = getDb();
  await db.delete(aiProviders).where(eq(aiProviders.id, id));
  return NextResponse.json({ ok: true });
}
