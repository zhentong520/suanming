import { getDb } from "@/lib/db/client";
import { userOperations } from "@/lib/db/schema";

export async function logUserOperation(input: {
  userId: string;
  action: string;
  moduleId?: string;
  profileId?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  await db.insert(userOperations).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    action: input.action,
    moduleId: input.moduleId ?? null,
    profileId: input.profileId ?? null,
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: new Date().toISOString(),
  });
}
