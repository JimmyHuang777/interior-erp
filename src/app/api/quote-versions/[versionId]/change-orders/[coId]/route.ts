import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quoteChangeOrders } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  itemName: z.string().optional(),
  quantity: z.number().optional(),
  unit: z.string().nullable().optional(),
  unitPrice: z.number().optional(),
  ownerUnitPrice: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const PATCH = apiRoute(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string; coId: string }> },
) {
  const user = await requireUser();
  const { coId } = await params;
  const body = schema.parse(await req.json());

  const set: Record<string, unknown> = { ...body };
  if (body.quantity != null) set.quantity = String(body.quantity);
  if (body.unitPrice != null) set.unitPrice = String(body.unitPrice);
  if ("ownerUnitPrice" in body) {
    set.ownerUnitPrice = body.ownerUnitPrice != null ? String(body.ownerUnitPrice) : null;
  }

  const [row] = await db
    .update(quoteChangeOrders)
    .set(set)
    .where(eq(quoteChangeOrders.id, coId))
    .returning();

  await logAction(user.id, "UPDATE", "quote_change_order", coId, body);
  return NextResponse.json(row);
});

export const DELETE = apiRoute(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string; coId: string }> },
) {
  const user = await requireUser();
  const { coId } = await params;
  await db.delete(quoteChangeOrders).where(eq(quoteChangeOrders.id, coId));
  await logAction(user.id, "DELETE", "quote_change_order", coId);
  return NextResponse.json({ ok: true });
});
