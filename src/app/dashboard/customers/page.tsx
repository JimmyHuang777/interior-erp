import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logAction } from "@/lib/audit";

async function addCustomer(formData: FormData) {
  "use server";
  const session = await auth();
  const [row] = await db
    .insert(customers)
    .values({
      name: String(formData.get("name")),
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      address: (formData.get("address") as string) || null,
      source: (formData.get("source") as string) || null,
      ownerUserId: (session?.user as { id: string } | undefined)?.id,
    })
    .returning();
  if (session?.user) {
    await logAction((session.user as { id: string }).id, "CREATE", "customer", row.id);
    await logAction((session.user as { id: string }).id, "VIEW_LIST", "customer");
  }
  revalidatePath("/dashboard/customers");
}

export default async function CustomersPage() {
  const session = await auth();
  if (session?.user) {
    await logAction((session.user as { id: string }).id, "VIEW_LIST", "customer");
  }

  const rows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      address: customers.address,
      source: customers.source,
      ownerName: users.name,
    })
    .from(customers)
    .leftJoin(users, eq(customers.ownerUserId, users.id))
    .orderBy(desc(customers.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">🔒 客戶清單</h1>
      <p className="text-sm text-slate-500 mb-6">
        業主聯絡資訊・加密保護・僅限授權查閱（此頁僅管理者可見，所有存取均有紀錄）
      </p>

      <form
        action={addCustomer}
        className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">姓名</label>
          <input name="name" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">電話</label>
          <input name="phone" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Email</label>
          <input name="email" type="email" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">地址</label>
          <input name="address" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">來源</label>
          <input name="source" placeholder="官網表單/轉介" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div className="col-span-5">
          <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">
            新增客戶
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">姓名</th>
              <th className="text-left px-3 py-2 font-medium">電話</th>
              <th className="text-left px-3 py-2 font-medium">Email</th>
              <th className="text-left px-3 py-2 font-medium">地址</th>
              <th className="text-left px-3 py-2 font-medium">來源</th>
              <th className="text-left px-3 py-2 font-medium">負責人</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{c.name}</td>
                <td className="px-3 py-2 text-slate-600">{c.phone || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{c.email || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{c.address || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{c.source || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{c.ownerName || "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  尚無客戶資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
