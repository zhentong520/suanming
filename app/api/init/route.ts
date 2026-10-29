import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/db/seed";
import { assertProductionSecrets } from "@/lib/security/production-guards";

let seeded = false;

export async function ensureSeeded() {
  if (!seeded) {
    assertProductionSecrets();
    await seedDatabase();
    seeded = true;
  }
}

export async function GET() {
  await ensureSeeded();
  return NextResponse.json({ ok: true, message: "数据库已初始化" });
}
