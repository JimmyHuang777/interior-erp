import { db } from "@/db";
import { contracts, projects } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logAction } from "@/lib/audit";

async function addContract(formData: FormData) {
  "use server";
  const session = await auth();
  const [row] = await db
    .insert(contracts)
    .values({
      projectId: String(formData.get("projectId")),
      type: String(formData.get("type")),
      amount: (formData.get("amount") as string) || null,
      signedDate: (formData.get("signedDate") as string) || null,
      language: String(formData.get("language") || "zh"),
    })
    .returning();
  if (session?.user) {
    await logAction((session.user as { id: string }).id, "CREATE", "contract", row.id);
  }
  revalidatePath("/dashboard/contracts");
}

export default async function ContractsPage() {
  const [rows, projectRows] = await Promise.all([
    db
      .select({
        id: contracts.id,
        type: contracts.type,
        amount: contracts.amount,
        signedDate: contracts.signedDate,
        language: contracts.language,
        projectName: projects.name,
      })
      .from(contracts)
      .leftJoin(projects, eq(contracts.projectId, projects.id))
      .orderBy(desc(contracts.createdAt)),
    db.select().from(projects),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">合約工程</h1>
      <p className="text-sm text-slate-500 mb-6">室內設計合約書・填表自動產生・中英雙語・PDF 匯出（PDF 產生功能可於下一階段接入）</p>

      <form
        action={addContract}
        className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-xs text-slate-500 mb-1">案件</label>
          <select name="projectId" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
            {projectRows.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">類型</label>
          <select name="type" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
            <option value="DESIGN">設計合約</option>
            <option value="CONSTRUCTION">工程合約</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">金額</label>
          <input type="number" name="amount" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">簽約日</label>
          <input type="date" name="signedDate" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">語言</label>
          <select name="language" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
            <option value="zh">中文</option>
            <option value="en">English</option>
            <option value="bilingual">中英雙語</option>
          </select>
        </div>
        <div className="col-span-5">
          <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">
            新增合約
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">案件</th>
              <th className="text-left px-3 py-2 font-medium">類型</th>
              <th className="text-left px-3 py-2 font-medium">金額</th>
              <th className="text-left px-3 py-2 font-medium">簽約日</th>
              <th className="text-left px-3 py-2 font-medium">語言</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{c.projectName}</td>
                <td className="px-3 py-2 text-slate-600">{c.type === "DESIGN" ? "設計合約" : "工程合約"}</td>
                <td className="px-3 py-2 text-slate-600">
                  {c.amount ? `NT$ ${Number(c.amount).toLocaleString()}` : "-"}
                </td>
                <td className="px-3 py-2 text-slate-600">{c.signedDate || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{c.language}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                  尚無合約
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
