import { db } from "@/db";
import { hrDocuments } from "@/db/schema";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logAction } from "@/lib/audit";

const TYPE_LABEL: Record<string, string> = {
  RESIGNATION: "離職切結",
  NDA: "保密協議",
  HANDOVER: "交接確認表",
};

async function addDoc(formData: FormData) {
  "use server";
  const session = await auth();
  const [row] = await db
    .insert(hrDocuments)
    .values({
      employeeName: String(formData.get("employeeName")),
      type: String(formData.get("type")),
      issuedDate: (formData.get("issuedDate") as string) || null,
    })
    .returning();
  if (session?.user) {
    await logAction((session.user as { id: string }).id, "CREATE", "hr_document", row.id);
  }
  revalidatePath("/dashboard/hr");
}

export default async function HrPage() {
  const session = await auth();
  if (session?.user) {
    await logAction((session.user as { id: string }).id, "VIEW_LIST", "hr_document");
  }

  const rows = await db.select().from(hrDocuments).orderBy(desc(hrDocuments.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">🔒 人事表單</h1>
      <p className="text-sm text-slate-500 mb-6">
        離職切結・保密協議・交接確認表・一鍵列印 PDF（PDF 產生功能可於下一階段接入）。此頁僅管理者與行政可見，所有存取均有紀錄。
      </p>

      <form
        action={addDoc}
        className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">員工姓名</label>
          <input name="employeeName" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">表單類型</label>
          <select name="type" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
            <option value="RESIGNATION">離職切結</option>
            <option value="NDA">保密協議</option>
            <option value="HANDOVER">交接確認表</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">日期</label>
          <input type="date" name="issuedDate" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">
            新增表單
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">員工</th>
              <th className="text-left px-3 py-2 font-medium">類型</th>
              <th className="text-left px-3 py-2 font-medium">日期</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{d.employeeName}</td>
                <td className="px-3 py-2 text-slate-600">{TYPE_LABEL[d.type] || d.type}</td>
                <td className="px-3 py-2 text-slate-600">{d.issuedDate || "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-slate-400">
                  尚無表單紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
