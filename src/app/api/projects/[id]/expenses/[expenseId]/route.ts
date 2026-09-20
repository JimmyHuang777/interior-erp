import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  description: z.string().optional(),
  amount: z.number().optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
});

export const PATCH = apiRoute(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> },
) {
  const user = await requireUser();
  const { expenseId } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .update(expenses)
    .set({
      ...body,
      amount: body.amount != null ? String(body.amount) : undefined,
    })
    .where(eq(expenses.id, expenseId))
    .returning();

  await logAction(user.id, "UPDATE", "expense", expenseId, body);
  return NextResponse.json(row);
});

export const DELETE = apiRoute(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> },
) {
  const user = await requireUser();
  const { expenseId } = await params;
  await db.delete(expenses).where(eq(expenses.id, expenseId));
  await logAction(user.id, "DELETE", "expense", expenseId);
  return NextResponse.json({ ok: true });
});
