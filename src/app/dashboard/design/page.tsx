import { db } from "@/db";
import { projects, designStages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { logAction } from "@/lib/audit";
import ProjectPicker from "@/components/ProjectPicker";

async function addStage(formData: FormData) {
  "use server";
  const session = await auth();
  const projectId = String(formData.get("projectId"));
  const [row] = await db
    .insert(designStages)
    .values({
      projectId,
      name: String(formData.get("name")),
      dueDate: (formData.get("dueDate") as string) || null,
    })
    .returning();
  if (session?.user) {
    await logAction((session.user as { id: string }).id, "CREATE", "design_stage", row.id);
  }
  revalidatePath("/dashboard/design");
}

async function confirmStage(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await db
    .update(designStages)
    .set({ clientConfirmedAt: new Date(), completedAt: new Date() })
    .where(eq(designStages.id, id));
  revalidatePath("/dashboard/design");
}

export default async function DesignPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const projectRows = await db.select().from(projects);
  const activeProjectId = projectId || projectRows[0]?.id;

  const stages = activeProjectId
    ? await db
        .select()
        .from(designStages)
        .where(eq(designStages.projectId, activeProjectId))
        .orderBy(asc(designStages.sortOrder))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">設計管理</h1>
      <p className="text-sm text-slate-500 mb-6">設計流程追蹤・各階段收款・材料板管理・業主確認紀錄</p>

      <div className="mb-6">
        <ProjectPicker basePath="/dashboard/design" projects={projectRows} activeProjectId={activeProjectId} />
      </div>

      {activeProjectId && (
        <>
          <form
            action={addStage}
            className="bg-white border border-slate-200 rounded-lg p-4 mb-6 flex gap-3 items-end"
          >
            <input type="hidden" name="projectId" value={activeProjectId} />
            <div>
              <label className="block text-xs text-slate-500 mb-1">階段名稱</label>
              <input
                name="name"
                required
                placeholder="丈量/平面配置/3D 透視/施工圖"
                className="border border-slate-300 rounded px-2 py-1.5 text-sm w-64"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">預定完成日</label>
              <input type="date" name="dueDate" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">
              新增階段
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">階段</th>
                  <th className="text-left px-3 py-2 font-medium">預定完成</th>
                  <th className="text-left px-3 py-2 font-medium">完成時間</th>
                  <th className="text-left px-3 py-2 font-medium">業主確認</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {stages.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{s.name}</td>
                    <td className="px-3 py-2 text-slate-600">{s.dueDate || "-"}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {s.clientConfirmedAt ? (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          已確認 {new Date(s.clientConfirmedAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                          待確認
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!s.clientConfirmedAt && (
                        <form action={confirmStage}>
                          <input type="hidden" name="id" value={s.id} />
                          <button className="text-xs text-slate-700 hover:underline">標記業主已確認</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {stages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                      尚無設計階段
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
