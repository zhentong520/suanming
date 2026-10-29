import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { ensureSeeded } from "../../init/route";
import { getDb } from "@/lib/db/client";
import { profiles, userOperations } from "@/lib/db/schema";
import { isAuthError, requireUser } from "@/lib/user/profiles";
import { getPointsStatus } from "@/lib/billing/points";

export async function GET(request: Request) {
  await ensureSeeded();
  const session = await requireUser(request);
  if (isAuthError(session)) return session;

  const db = getDb();
  const userProfiles = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.userId))
    .orderBy(desc(profiles.createdAt));

  const recentOpsRaw = await db
    .select()
    .from(userOperations)
    .where(eq(userOperations.userId, session.userId))
    .orderBy(desc(userOperations.createdAt))
    .limit(20);

  const recentOperations = recentOpsRaw.map((op) => {
    let reportId: string | null = null;
    let pointsSpent: number | null = null;
    if (op.metadataJson) {
      try {
        const meta = JSON.parse(op.metadataJson) as { reportId?: string; pointsSpent?: number };
        if (typeof meta.reportId === "string") reportId = meta.reportId;
        if (typeof meta.pointsSpent === "number") pointsSpent = meta.pointsSpent;
      } catch {
        /* ignore */
      }
    }
    return {
      id: op.id,
      action: op.action,
      moduleId: op.moduleId,
      profileId: op.profileId,
      reportId,
      pointsSpent,
      createdAt: op.createdAt,
    };
  });

  const points = await getPointsStatus(session.userId);

  return NextResponse.json({
    user: {
      id: session.userId,
      email: session.email,
      phone: session.phone,
      displayName: session.displayName,
      activeProfileId: session.activeProfileId,
      role: session.role,
      status: points.status,
    },
    points: {
      balance: points.balance,
      unlimited: points.unlimited,
      billingEnabled: points.billingEnabled,
    },
    /** @deprecated */
    aiQuota: {
      used: 0,
      limit: points.balance,
      remaining: points.unlimited ? null : points.balance,
      unlimited: points.unlimited,
    },
    profiles: userProfiles,
    recentOperations,
  });
}
