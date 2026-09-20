import { db } from "@/db";
import { vendors, trades } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logAction } from "@/lib/audit";

async function addVendor(formData: FormData) {
  "use server";
  const session = await auth();
  const [row] = await db
    .insert(vendors)
    .values({
      name: String(formData.get("name")),
      tradeId: (formData.get("tradeId") as string) || null,
      contactName: (formData.get("contactName") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
    })
    .returning();
  if (session?.user) {
    await logAction((session.user as { id: string }).id, "CREATE", "vendor", row.id);
  }
  revalidatePath("/dashboard/vendors");
}

export default async function VendorsPage() {
  const [vendorRows, tradeRows] = await Promise.all([
    db
      .select({
        id: vendors.id,
        name: vendors.name,
        contactName: vendors.contactName,
        phone: vendors.phone,
        email: vendors.email,
        tradeName: trades.name,
      })
      .from(vendors)
      .leftJoin(trades, eq(vendors.tradeId, trades.id)),
    db.select().from(trades),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">廠商清冊</h1>
      <p className="text-sm text-slate-500 mb-6">工班廠商資料管理、聯絡電話、Email、依工種分類查詢</p>

      <form
        action={addVendor}
        className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">廠商名稱</label>
          <input name="name" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">工種</label>
          <select name="tradeId" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
            <option value="">-</option>
            {tradeRows.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">聯絡人</label>
          <input name="contactName" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">電話</label>
          <input name="phone" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Email</label>
          <input name="email" type="email" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="col-span-5">
          <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">
            新增廠商
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">廠商名稱</th>
              <th className="text-left px-3 py-2 font-medium">工種</th>
              <th className="text-left px-3 py-2 font-medium">聯絡人</th>
              <th className="text-left px-3 py-2 font-medium">電話</th>
              <th className="text-left px-3 py-2 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {vendorRows.map((v) => (
              <tr key={v.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{v.name}</td>
                <td className="px-3 py-2 text-slate-600">{v.tradeName || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{v.contactName || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{v.phone || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{v.email || "-"}</td>
              </tr>
            ))}
            {vendorRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  尚無廠商資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
