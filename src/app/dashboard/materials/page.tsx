import { db } from "@/db";
import { materials } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logAction } from "@/lib/audit";
import { desc } from "drizzle-orm";

async function addMaterial(formData: FormData) {
  "use server";
  const session = await auth();
  const [row] = await db
    .insert(materials)
    .values({
      name: String(formData.get("name")),
      category: (formData.get("category") as string) || null,
      brand: (formData.get("brand") as string) || null,
      unitPrice: (formData.get("unitPrice") as string) || null,
      unit: (formData.get("unit") as string) || null,
      location: (formData.get("location") as string) || null,
    })
    .returning();
  if (session?.user) {
    await logAction((session.user as { id: string }).id, "CREATE", "material", row.id);
  }
  revalidatePath("/dashboard/materials");
}

export default async function MaterialsPage() {
  const rows = await db.select().from(materials).orderBy(desc(materials.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">材料資料庫</h1>
      <p className="text-sm text-slate-500 mb-6">材料樣品庫、類別、品牌、價格、放置櫃位、狀態管理</p>

      <form
        action={addMaterial}
        className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-6 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">材料名稱</label>
          <input name="name" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">類別</label>
          <input name="category" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">品牌</label>
          <input name="brand" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">單價</label>
          <input type="number" name="unitPrice" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">單位</label>
          <input name="unit" placeholder="坪/片/m" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">放置櫃位</label>
          <input name="location" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="col-span-6">
          <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">
            新增材料
          </button>
        </div>
      </form>

      <div className="grid grid-cols-4 gap-4">
        {rows.map((m) => (
          <div key={m.id} className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="font-medium text-slate-900">{m.name}</div>
            <div className="text-xs text-slate-500 mt-1">
              {m.category} {m.brand ? `・${m.brand}` : ""}
            </div>
            <div className="text-sm text-slate-700 mt-2">
              {m.unitPrice ? `NT$ ${Number(m.unitPrice).toLocaleString()}` : "-"}
              {m.unit ? ` / ${m.unit}` : ""}
            </div>
            <div className="text-xs text-slate-400 mt-1">櫃位：{m.location || "-"}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-slate-400 text-sm col-span-4">尚無材料資料</div>}
      </div>
    </div>
  );
}
