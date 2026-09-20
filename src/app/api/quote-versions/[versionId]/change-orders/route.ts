import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quoteChangeOrders } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  itemName: z.string().min(1),
  quantity: z.number().optional(),
  unit: z.string().nullable().optional(),
  unitPrice: z.number().optional(), // 減項用負數
  ownerUnitPrice: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const POST = apiRoute(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> },
) {
  const user = await requireUser();
  const { versionId } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .insert(quoteChangeOrders)
    .values({
      versionId,
      itemName: body.itemName,
      quantity: String(body.quantity ?? 1),
      unit: body.unit || null,
      unitPrice: String(body.unitPrice ?? 0),
      ownerUnitPrice: body.ownerUnitPrice != null ? String(body.ownerUnitPrice) : null,
      notes: body.notes || null,
    })
    .returning();

  await logAction(user.id, "CREATE", "quote_change_order", row.id, { versionId });
  return NextResponse.json(row);
});
