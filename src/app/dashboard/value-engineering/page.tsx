import { db } from "@/db";
import { projects, quoteVersions, quoteItems, quoteChangeOrders, trades, materials } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import ValueEngineeringWorkspace from "@/components/value-engineering/ValueEngineeringWorkspace";
import ProjectPicker from "@/components/ProjectPicker";

export default async function ValueEngineeringPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string; versionId?: string }>;
}) {
  const { projectId, versionId } = await searchParams;
  const projectRows = await db.select().from(projects);
  const activeProjectId = projectId || projectRows[0]?.id;

  let versions = activeProjectId
    ? await db
        .select()
        .from(quoteVersions)
        .where(eq(quoteVersions.projectId, activeProjectId))
        .orderBy(asc(quoteVersions.sortOrder))
    : [];

  // 每個案件至少要有一個估價版本，沒有就自動建立
  if (activeProjectId && versions.length === 0) {
    const [created] = await db
      .insert(quoteVersions)
      .values({ projectId: activeProjectId, name: "版本 1", costMultiplier: "1.2" })
      .returning();
    versions = [created];
  }

  const activeVersionId = versionId || versions[0]?.id;

  const [items, changeOrders, tradeRows, materialRows] = await Promise.all([
    activeVersionId
      ? db
          .select()
          .from(quoteItems)
          .where(eq(quoteItems.versionId, activeVersionId))
          .orderBy(asc(quoteItems.sortOrder))
      : Promise.resolve([]),
    activeVersionId
      ? db
          .select()
          .from(quoteChangeOrders)
          .where(eq(quoteChangeOrders.versionId, activeVersionId))
          .orderBy(asc(quoteChangeOrders.sortOrder))
      : Promise.resolve([]),
    db.select().from(trades),
    db.select().from(materials),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">價值工程</h1>
      <p className="text-sm text-slate-500 mb-6">
        成本估價單・業主估價單・追加減單・成本分析表 — 依工種分組，逐項手動新增
      </p>

      <div className="mb-6">
        <ProjectPicker
          basePath="/dashboard/value-engineering"
          projects={projectRows}
          activeProjectId={activeProjectId}
        />
      </div>

      {activeProjectId && activeVersionId && (
        <ValueEngineeringWorkspace
          projectId={activeProjectId}
          versions={versions.map((v) => ({
            id: v.id,
            name: v.name,
            costMultiplier: v.costMultiplier,
          }))}
          activeVersionId={activeVersionId}
          items={items.map((i) => ({
            id: i.id,
            tradeId: i.tradeId,
            itemName: i.itemName,
            unit: i.unit,
            quantity: i.quantity || "0",
            unitPrice: i.unitPrice || "0",
            ownerUnitPrice: i.ownerUnitPrice,
            notes: i.notes,
            colorTag: i.colorTag,
          }))}
          changeOrders={changeOrders.map((c) => ({
            id: c.id,
            itemName: c.itemName,
            quantity: c.quantity || "1",
            unit: c.unit,
            unitPrice: c.unitPrice || "0",
            ownerUnitPrice: c.ownerUnitPrice,
            notes: c.notes,
          }))}
          trades={tradeRows}
          materials={materialRows.map((m) => ({
            id: m.id,
            name: m.name,
            unitPrice: m.unitPrice,
            unit: m.unit,
          }))}
        />
      )}
    </div>
  );
}
