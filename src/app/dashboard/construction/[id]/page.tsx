import { db } from "@/db";
import {
  projects,
  customers,
  constructionTasks,
  paymentSchedules,
  expenses,
  changeOrders,
  trades,
  vendors,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ConstructionWorkspace from "@/components/construction/ConstructionWorkspace";

export default async function ProjectConstructionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      contractAmount: projects.contractAmount,
      taxIncluded: projects.taxIncluded,
      startDate: projects.startDate,
      endDate: projects.endDate,
      customerName: customers.name,
    })
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .where(eq(projects.id, id))
    .limit(1);

  if (!project) notFound();

  const [taskRows, paymentRows, expenseRows, coRows, tradeRows, vendorRows] =
    await Promise.all([
      db
        .select()
        .from(constructionTasks)
        .where(eq(constructionTasks.projectId, id)),
      db
        .select()
        .from(paymentSchedules)
        .where(eq(paymentSchedules.projectId, id)),
      db.select().from(expenses).where(eq(expenses.projectId, id)),
      db.select().from(changeOrders).where(eq(changeOrders.projectId, id)),
      db.select().from(trades),
      db.select().from(vendors),
    ]);

  return (
    <ConstructionWorkspace
      project={project}
      tasks={taskRows}
      payments={paymentRows}
      expenses={expenseRows}
      changeOrders={coRows}
      trades={tradeRows}
      vendors={vendorRows.map((v) => ({ id: v.id, name: v.name, tradeId: v.tradeId }))}
    />
  );
}
