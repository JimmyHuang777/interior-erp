import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quoteItems, quoteVersions } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  itemName: z.string().min(1),
  tradeId: z.string().uuid().nullable().optional(),
  materialId: z.string().uuid().nullable().optional(),
  unit: z.string().nullable().optional(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  ownerUnitPrice: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  colorTag: z.string().nullable().optional(),
});

export const POST = apiRoute(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ versionId: string }> },
) {
  const user = await requireUser();
  const { versionId } = await params;
  const body = schema.parse(await req.json());

  const [version] = await db
    .select()
    .from(quoteVersions)
    .where(eq(quoteVersions.id, versionId))
    .limit(1);
  if (!version) {
    return NextResponse.json({ error: "版本不存在" }, { status: 404 });
  }

  const [row] = await db
    .insert(quoteItems)
    .values({
      versionId,
      projectId: version.projectId,
      itemName: body.itemName,
      tradeId: body.tradeId || null,
      materialId: body.materialId || null,
      unit: body.unit || null,
      quantity: String(body.quantity ?? 0),
      unitPrice: String(body.unitPrice ?? 0),
      ownerUnitPrice: body.ownerUnitPrice != null ? String(body.ownerUnitPrice) : null,
      notes: body.notes || null,
      colorTag: body.colorTag || null,
    })
    .returning();

  await logAction(user.id, "CREATE", "quote_item", row.id, { versionId });
  return NextResponse.json(row);
});
