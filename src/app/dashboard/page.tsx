import { db } from "@/db";
import { projects, customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

const STATUS_LABEL: Record<string, string> = {
  INQUIRY: "洽談中",
  DESIGN: "設計中",
  CONTRACTED: "已簽約",
  CONSTRUCTION: "施工中",
  COMPLETED: "已完工",
  WARRANTY: "保固中",
};

const STATUS_COLOR: Record<string, string> = {
  INQUIRY: "bg-slate-100 text-slate-700",
  DESIGN: "bg-blue-100 text-blue-700",
  CONTRACTED: "bg-purple-100 text-purple-700",
  CONSTRUCTION: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  WARRANTY: "bg-teal-100 text-teal-700",
};

export default async function DashboardHome() {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      contractAmount: projects.contractAmount,
      startDate: projects.startDate,
      endDate: projects.endDate,
      customerName: customers.name,
    })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .orderBy(desc(projects.createdAt));

  const activeCount = rows.filter((r) => r.status === "CONSTRUCTION").length;
  const totalContract = rows.reduce(
    (sum, r) => sum + Number(r.contractAmount || 0),
    0,
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">總覽</h1>
      <p className="text-sm text-slate-500 mb-6">目前案件與各模組入口</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500">總案件數</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">{rows.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500">施工中案件</div>
          <div className="text-2xl font-semibold text-amber-600 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500">合約總金額</div>
          <div className="text-2xl font-semibold text-slate-900 mt-1">
            NT$ {totalContract.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-medium">案件名稱</th>
              <th className="text-left px-4 py-3 font-medium">業主</th>
              <th className="text-left px-4 py-3 font-medium">狀態</th>
              <th className="text-left px-4 py-3 font-medium">合約金額</th>
              <th className="text-left px-4 py-3 font-medium">工期</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.customerName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.contractAmount ? `NT$ ${Number(r.contractAmount).toLocaleString()}` : "-"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.startDate} ~ {r.endDate}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/construction/${r.id}`}
                    className="text-slate-900 hover:underline text-sm"
                  >
                    查看工程 →
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  尚無案件
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
