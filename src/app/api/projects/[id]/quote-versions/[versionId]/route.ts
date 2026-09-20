import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quoteVersions } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  costMultiplier: z.number().positive().optional(),
});

export const PATCH = apiRoute(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const user = await requireUser();
  const { versionId } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .update(quoteVersions)
    .set({
      ...(body.name != null ? { name: body.name } : {}),
      ...(body.costMultiplier != null
        ? { costMultiplier: String(body.costMultiplier) }
        : {}),
    })
    .where(eq(quoteVersions.id, versionId))
    .returning();

  await logAction(user.id, "UPDATE", "quote_version", versionId, body);
  return NextResponse.json(row);
});

export const DELETE = apiRoute(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const user = await requireUser();
  const { versionId } = await params;
  await db.delete(quoteVersions).where(eq(quoteVersions.id, versionId));
  await logAction(user.id, "DELETE", "quote_version", versionId);
  return NextResponse.json({ ok: true });
});
