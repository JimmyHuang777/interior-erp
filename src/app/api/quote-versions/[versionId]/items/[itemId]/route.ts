import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quoteItems } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  itemName: z.string().optional(),
  tradeId: z.string().uuid().nullable().optional(),
  materialId: z.string().uuid().nullable().optional(),
  unit: z.string().nullable().optional(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  ownerUnitPrice: z.number().nullable().optional(), // null = 還原為自動換算
  notes: z.string().nullable().optional(),
  colorTag: z.string().nullable().optional(),
});

export const PATCH = apiRoute(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string; itemId: string }> },
) {
  const user = await requireUser();
  const { itemId } = await params;
  const raw = await req.json();
  const body = schema.parse(raw);

  const set: Record<string, unknown> = { ...body };
  if (body.quantity != null) set.quantity = String(body.quantity);
  if (body.unitPrice != null) set.unitPrice = String(body.unitPrice);
  if ("ownerUnitPrice" in body) {
    set.ownerUnitPrice = body.ownerUnitPrice != null ? String(body.ownerUnitPrice) : null;
  }

  const [row] = await db
    .update(quoteItems)
    .set(set)
    .where(eq(quoteItems.id, itemId))
    .returning();

  await logAction(user.id, "UPDATE", "quote_item", itemId, body);
  return NextResponse.json(row);
});

export const DELETE = apiRoute(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ versionId: string; itemId: string }> },
) {
  const user = await requireUser();
  const { itemId } = await params;
  await db.delete(quoteItems).where(eq(quoteItems.id, itemId));
  await logAction(user.id, "DELETE", "quote_item", itemId);
  return NextResponse.json({ ok: true });
});
