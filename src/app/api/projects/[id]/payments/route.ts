import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentSchedules } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  sequence: z.number().optional(),
  percentage: z.number().nullable().optional(),
  amount: z.number(),
  dueDate: z.string().nullable().optional(),
});

export const POST = apiRoute(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .insert(paymentSchedules)
    .values({
      projectId: id,
      name: body.name,
      sequence: body.sequence ?? 1,
      percentage: body.percentage != null ? String(body.percentage) : null,
      amount: String(body.amount),
      dueDate: body.dueDate || null,
    })
    .returning();

  await logAction(user.id, "CREATE", "payment_schedule", row.id, { projectId: id });

  return NextResponse.json(row);
});
