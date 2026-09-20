import { db } from "@/db";
import { projects, quoteItems, trades, materials } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import QuoteEditor from "@/components/value-engineering/QuoteEditor";

export default async function ValueEngineeringPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const projectRows = await db.select().from(projects);
  const activeProjectId = projectId || projectRows[0]?.id;

  const [items, tradeRows, materialRows] = await Promise.all([
    activeProjectId
      ? db
          .select()
          .from(quoteItems)
          .where(eq(quoteItems.projectId, activeProjectId))
          .orderBy(asc(quoteItems.sortOrder))
      : Promise.resolve([]),
    db.select().from(trades),
    db.select().from(materials),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">價值工程</h1>
      <p className="text-sm text-slate-500 mb-6">工程估價單・下拉選單帶入工項・單位單價自動填入・匯出報表</p>

      <form method="get" className="mb-6">
        <select
          name="projectId"
          defaultValue={activeProjectId}
          onChange={(e) => e.currentTarget.form?.submit()}
          className="border border-slate-300 rounded px-3 py-2 text-sm"
        >
          {projectRows.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </form>

      {activeProjectId && (
        <QuoteEditor
          projectId={activeProjectId}
          initialItems={items.map((i) => ({
            id: i.id,
            itemName: i.itemName,
            tradeId: i.tradeId,
            materialId: i.materialId,
            unit: i.unit,
            quantity: i.quantity || "0",
            unitPrice: i.unitPrice || "0",
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
