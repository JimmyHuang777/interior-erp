import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { constructionTasks } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  tradeId: z.string().uuid().nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  plannedStart: z.string().nullable().optional(),
  plannedEnd: z.string().nullable().optional(),
  actualStart: z.string().nullable().optional(),
  actualEnd: z.string().nullable().optional(),
  progressPct: z.number().min(0).max(100).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "DELAYED"]).optional(),
});

export const PATCH = apiRoute(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const user = await requireUser();
  const { taskId } = await params;
  const body = schema.parse(await req.json());

  const [task] = await db
    .update(constructionTasks)
    .set(body)
    .where(eq(constructionTasks.id, taskId))
    .returning();

  await logAction(user.id, "UPDATE", "construction_task", taskId, body);

  return NextResponse.json(task);
});

export const DELETE = apiRoute(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> },
) {
  const user = await requireUser();
  const { taskId } = await params;

  await db.delete(constructionTasks).where(eq(constructionTasks.id, taskId));
  await logAction(user.id, "DELETE", "construction_task", taskId);

  return NextResponse.json({ ok: true });
});
