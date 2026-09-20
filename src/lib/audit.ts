import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAction(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  detail?: Record<string, unknown>,
) {
  try {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId,
      detail: detail ?? null,
    });
  } catch {
    // audit logging must never break the main request
  }
}
