import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { constructionTasks } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  tradeId: z.string().uuid().nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  plannedStart: z.string().nullable().optional(),
  plannedEnd: z.string().nullable().optional(),
  progressPct: z.number().min(0).max(100).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "DONE", "DELAYED"]).optional(),
});

export const POST = apiRoute(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = schema.parse(await req.json());

  const [task] = await db
    .insert(constructionTasks)
    .values({
      projectId: id,
      name: body.name,
      tradeId: body.tradeId || null,
      vendorId: body.vendorId || null,
      plannedStart: body.plannedStart || null,
      plannedEnd: body.plannedEnd || null,
      progressPct: body.progressPct ?? 0,
      status: body.status ?? "NOT_STARTED",
    })
    .returning();

  await logAction(user.id, "CREATE", "construction_task", task.id, { projectId: id });

  return NextResponse.json(task);
});
