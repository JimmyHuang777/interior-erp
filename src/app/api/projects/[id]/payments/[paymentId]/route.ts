import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentSchedules } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().optional(),
  amount: z.number().optional(),
  dueDate: z.string().nullable().optional(),
  paidDate: z.string().nullable().optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
});

export const PATCH = apiRoute(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const user = await requireUser();
  const { paymentId } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .update(paymentSchedules)
    .set({
      ...body,
      amount: body.amount != null ? String(body.amount) : undefined,
    })
    .where(eq(paymentSchedules.id, paymentId))
    .returning();

  await logAction(user.id, "UPDATE", "payment_schedule", paymentId, body);

  return NextResponse.json(row);
});

export const DELETE = apiRoute(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  const user = await requireUser();
  const { paymentId } = await params;
  await db.delete(paymentSchedules).where(eq(paymentSchedules.id, paymentId));
  await logAction(user.id, "DELETE", "payment_schedule", paymentId);
  return NextResponse.json({ ok: true });
});
