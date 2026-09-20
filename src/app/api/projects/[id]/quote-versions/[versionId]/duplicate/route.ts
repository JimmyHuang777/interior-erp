import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quoteVersions, quoteItems, quoteChangeOrders } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";

export const POST = apiRoute(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const user = await requireUser();
  const { id, versionId } = await params;

  const [source] = await db
    .select()
    .from(quoteVersions)
    .where(eq(quoteVersions.id, versionId))
    .limit(1);
  if (!source) {
    return NextResponse.json({ error: "版本不存在" }, { status: 404 });
  }

  const existing = await db
    .select()
    .from(quoteVersions)
    .where(eq(quoteVersions.projectId, id));

  const [newVersion] = await db
    .insert(quoteVersions)
    .values({
      projectId: id,
      name: `${source.name} 複製`,
      costMultiplier: source.costMultiplier,
      sortOrder: existing.length,
    })
    .returning();

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.versionId, versionId));

  if (items.length > 0) {
    await db.insert(quoteItems).values(
      items.map((i) => ({
        versionId: newVersion.id,
        projectId: id,
        tradeId: i.tradeId,
        materialId: i.materialId,
        itemName: i.itemName,
        unit: i.unit,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        ownerUnitPrice: i.ownerUnitPrice,
        notes: i.notes,
        colorTag: i.colorTag,
        sortOrder: i.sortOrder,
      })),
    );
  }

  const cos = await db
    .select()
    .from(quoteChangeOrders)
    .where(eq(quoteChangeOrders.versionId, versionId));

  if (cos.length > 0) {
    await db.insert(quoteChangeOrders).values(
      cos.map((c) => ({
        versionId: newVersion.id,
        itemName: c.itemName,
        quantity: c.quantity,
        unit: c.unit,
        unitPrice: c.unitPrice,
        ownerUnitPrice: c.ownerUnitPrice,
        notes: c.notes,
        sortOrder: c.sortOrder,
      })),
    );
  }

  await logAction(user.id, "DUPLICATE", "quote_version", newVersion.id, {
    from: versionId,
  });

  return NextResponse.json(newVersion);
});
