import { db } from "@/db";
import { projects, customers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export default async function ConstructionListPage() {
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      customerName: customers.name,
    })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .orderBy(desc(projects.createdAt));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">工程管理</h1>
      <p className="text-sm text-slate-500 mb-6">選擇案件以查看施工進度、收款、費用與利潤</p>

      <div className="grid grid-cols-2 gap-4">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/construction/${r.id}`}
            className="bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-400 transition"
          >
            <div className="font-medium text-slate-900">{r.name}</div>
            <div className="text-sm text-slate-500 mt-1">業主：{r.customerName}</div>
            <div className="text-xs text-slate-400 mt-2">{r.status}</div>
          </Link>
        ))}
        {rows.length === 0 && (
          <div className="text-slate-400 text-sm">尚無案件</div>
        )}
      </div>
    </div>
  );
}
