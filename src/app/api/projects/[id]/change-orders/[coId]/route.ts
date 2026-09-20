import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { changeOrders } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  description: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(["PROPOSED", "APPROVED", "REJECTED"]).optional(),
});

export const PATCH = apiRoute(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; coId: string }> },
) {
  const user = await requireUser();
  const { coId } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .update(changeOrders)
    .set({
      ...body,
      amount: body.amount != null ? String(body.amount) : undefined,
    })
    .where(eq(changeOrders.id, coId))
    .returning();

  await logAction(user.id, "UPDATE", "change_order", coId, body);
  return NextResponse.json(row);
});

export const DELETE = apiRoute(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; coId: string }> },
) {
  const user = await requireUser();
  const { coId } = await params;
  await db.delete(changeOrders).where(eq(changeOrders.id, coId));
  await logAction(user.id, "DELETE", "change_order", coId);
  return NextResponse.json({ ok: true });
});
