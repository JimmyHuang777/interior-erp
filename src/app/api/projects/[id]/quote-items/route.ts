import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quoteItems } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  itemName: z.string().min(1),
  tradeId: z.string().uuid().nullable().optional(),
  materialId: z.string().uuid().nullable().optional(),
  unit: z.string().nullable().optional(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
});

export const POST = apiRoute(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .insert(quoteItems)
    .values({
      projectId: id,
      itemName: body.itemName,
      tradeId: body.tradeId || null,
      materialId: body.materialId || null,
      unit: body.unit || null,
      quantity: String(body.quantity ?? 0),
      unitPrice: String(body.unitPrice ?? 0),
    })
    .returning();

  await logAction(user.id, "CREATE", "quote_item", row.id, { projectId: id });
  return NextResponse.json(row);
});
