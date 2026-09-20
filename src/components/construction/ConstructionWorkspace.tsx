"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ConstructionTask,
  PaymentSchedule,
  Expense,
  ChangeOrder,
  Trade,
  Vendor,
  ProjectSummary,
} from "./types";

const TABS = [
  { key: "overview", label: "總覽" },
  { key: "gantt", label: "進度與甘特圖" },
  { key: "payments", label: "收款" },
  { key: "expenses", label: "費用" },
  { key: "changeOrders", label: "追加減" },
  { key: "profit", label: "利潤" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "未開始",
  IN_PROGRESS: "進行中",
  DONE: "已完成",
  DELAYED: "延遲",
  PENDING: "待收款",
  PAID: "已收款",
  OVERDUE: "逾期",
  PROPOSED: "提案中",
  APPROVED: "已核准",
  REJECTED: "已駁回",
};

const STATUS_COLOR: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
  DELAYED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  PROPOSED: "bg-slate-100 text-slate-600",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

function fmt(n: number) {
  return "NT$ " + Math.round(n).toLocaleString();
}

export default function ConstructionWorkspace({
  project,
  tasks,
  payments,
  expenses,
  changeOrders,
  trades,
  vendors,
}: {
  project: ProjectSummary;
  tasks: ConstructionTask[];
  payments: PaymentSchedule[];
  expenses: Expense[];
  changeOrders: ChangeOrder[];
  trades: Trade[];
  vendors: Vendor[];
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const router = useRouter();

  const contractAmount = Number(project.contractAmount || 0);
  const changeOrderNet = changeOrders
    .filter((c) => c.status !== "REJECTED")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const receivable = contractAmount + changeOrderNet;
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const profit = receivable - totalExpense;
  const margin = receivable > 0 ? (profit / receivable) * 100 : 0;

  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalScheduled = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const overallProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((s, t) => s + t.progressPct, 0) / tasks.length)
      : 0;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            業主：{project.customerName} ・ {project.startDate} ~ {project.endDate}
            {project.taxIncluded ? "（含稅）" : "（未稅）"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">整體進度</div>
          <div className="text-2xl font-semibold text-slate-900">{overallProgress}%</div>
        </div>
      </div>

      <div className="border-b border-slate-200 mb-6 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-t-md transition ${
              tab === t.key
                ? "bg-white border border-b-white border-slate-200 text-slate-900 font-medium -mb-px"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="合約金額" value={fmt(contractAmount)} />
          <StatCard label="應收總額（含追加減）" value={fmt(receivable)} />
          <StatCard label="已收款" value={fmt(totalPaid)} sub={`/ ${fmt(totalScheduled)}`} />
          <StatCard
            label="毛利率"
            value={`${margin.toFixed(1)}%`}
            tone={margin >= 0 ? "green" : "red"}
          />
          <div className="col-span-4 bg-white rounded-lg border border-slate-200 p-5 mt-2">
            <div className="text-sm font-medium text-slate-900 mb-3">工項狀態分佈</div>
            <div className="flex gap-4 text-sm">
              {(["NOT_STARTED", "IN_PROGRESS", "DONE", "DELAYED"] as const).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[s]}`}>
                    {STATUS_LABEL[s]}
                  </span>
                  <span className="text-slate-600">
                    {tasks.filter((t) => t.status === s).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "gantt" && (
        <GanttTab
          projectId={project.id}
          tasks={tasks}
          trades={trades}
          vendors={vendors}
          onChanged={() => router.refresh()}
        />
      )}

      {tab === "payments" && (
        <PaymentsTab
          projectId={project.id}
          payments={payments}
          onChanged={() => router.refresh()}
        />
      )}

      {tab === "expenses" && (
        <ExpensesTab
          projectId={project.id}
          expenses={expenses}
          trades={trades}
          vendors={vendors}
          onChanged={() => router.refresh()}
        />
      )}

      {tab === "changeOrders" && (
        <ChangeOrdersTab
          projectId={project.id}
          changeOrders={changeOrders}
          onChanged={() => router.refresh()}
        />
      )}

      {tab === "profit" && (
        <ProfitTab
          contractAmount={contractAmount}
          changeOrderNet={changeOrderNet}
          receivable={receivable}
          totalExpense={totalExpense}
          profit={profit}
          margin={margin}
          expenses={expenses}
          trades={trades}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "green" | "red";
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`text-xl font-semibold mt-1 ${
          tone === "green" ? "text-green-600" : tone === "red" ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value} {sub && <span className="text-xs text-slate-400 font-normal">{sub}</span>}
      </div>
    </div>
  );
}

// ---------------- Gantt / Progress ----------------

function GanttTab({
  projectId,
  tasks,
  trades,
  vendors,
  onChanged,
}: {
  projectId: string;
  tasks: ConstructionTask[];
  trades: Trade[];
  vendors: Vendor[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const validDates = tasks.filter((t) => t.plannedStart && t.plannedEnd);
  const minDate = validDates.length
    ? new Date(Math.min(...validDates.map((t) => new Date(t.plannedStart!).getTime())))
    : new Date();
  const maxDate = validDates.length
    ? new Date(Math.max(...validDates.map((t) => new Date(t.plannedEnd!).getTime())))
    : new Date();
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / 86400000);

  async function addTask(formData: FormData) {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        tradeId: formData.get("tradeId") || null,
        vendorId: formData.get("vendorId") || null,
        plannedStart: formData.get("plannedStart") || null,
        plannedEnd: formData.get("plannedEnd") || null,
      }),
    });
    setSaving(false);
    setShowForm(false);
    onChanged();
  }

  async function updateTask(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/projects/${projectId}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    onChanged();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/projects/${projectId}/tasks/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-slate-500">共 {tasks.length} 個工項</div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
        >
          + 新增工項
        </button>
      </div>

      {showForm && (
        <form
          action={addTask}
          className="bg-white border border-slate-200 rounded-lg p-4 mb-4 grid grid-cols-5 gap-3 items-end"
        >
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">工項名稱</label>
            <input name="name" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">工種</label>
            <select name="tradeId" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
              <option value="">-</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">廠商</label>
            <select name="vendorId" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
              <option value="">-</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">起</label>
              <input type="date" name="plannedStart" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">迄</label>
              <input type="date" name="plannedEnd" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div className="col-span-5">
            <button
              disabled={saving}
              className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800 disabled:opacity-50"
            >
              儲存
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">工項</th>
              <th className="text-left px-3 py-2 font-medium">工種</th>
              <th className="text-left px-3 py-2 font-medium">廠商</th>
              <th className="text-left px-3 py-2 font-medium">起訖</th>
              <th className="text-left px-3 py-2 font-medium w-56">時程 / 進度</th>
              <th className="text-left px-3 py-2 font-medium">狀態</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const offset =
                t.plannedStart != null
                  ? ((new Date(t.plannedStart).getTime() - minDate.getTime()) / 86400000 / totalDays) * 100
                  : 0;
              const width =
                t.plannedStart && t.plannedEnd
                  ? Math.max(
                      2,
                      ((new Date(t.plannedEnd).getTime() - new Date(t.plannedStart).getTime()) /
                        86400000 /
                        totalDays) *
                        100,
                    )
                  : 0;
              return (
                <tr key={t.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{t.name}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {trades.find((tr) => tr.id === t.tradeId)?.name || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {vendors.find((v) => v.id === t.vendorId)?.name || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                    {t.plannedStart || "-"} ~ {t.plannedEnd || "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative h-4 bg-slate-100 rounded w-full">
                      <div
                        className="absolute h-4 bg-slate-300 rounded"
                        style={{ left: `${offset}%`, width: `${width}%` }}
                      />
                      <div
                        className="absolute h-4 bg-blue-500 rounded"
                        style={{
                          left: `${offset}%`,
                          width: `${(width * t.progressPct) / 100}%`,
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      defaultValue={t.progressPct}
                      onMouseUp={(e) =>
                        updateTask(t.id, { progressPct: Number((e.target as HTMLInputElement).value) })
                      }
                      className="w-full mt-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      defaultValue={t.status}
                      onChange={(e) => updateTask(t.id, { status: e.target.value })}
                      className={`text-xs rounded-full px-2 py-1 border-0 ${STATUS_COLOR[t.status]}`}
                    >
                      {(["NOT_STARTED", "IN_PROGRESS", "DONE", "DELAYED"] as const).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => deleteTask(t.id)}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  尚無工項，點右上角新增
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Payments ----------------

function PaymentsTab({
  projectId,
  payments,
  onChanged,
}: {
  projectId: string;
  payments: PaymentSchedule[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  async function addPayment(formData: FormData) {
    await fetch(`/api/projects/${projectId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        sequence: Number(formData.get("sequence") || 1),
        percentage: formData.get("percentage") ? Number(formData.get("percentage")) : null,
        amount: Number(formData.get("amount")),
        dueDate: formData.get("dueDate") || null,
      }),
    });
    setShowForm(false);
    onChanged();
  }

  async function markPaid(id: string, status: string) {
    await fetch(`/api/projects/${projectId}/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        paidDate: status === "PAID" ? new Date().toISOString().slice(0, 10) : null,
      }),
    });
    onChanged();
  }

  async function del(id: string) {
    await fetch(`/api/projects/${projectId}/payments/${id}`, { method: "DELETE" });
    onChanged();
  }

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);
  const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-slate-500">
          已收 {fmt(paid)} / 總期款 {fmt(total)}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
        >
          + 新增收款期別
        </button>
      </div>

      {showForm && (
        <form
          action={addPayment}
          className="bg-white border border-slate-200 rounded-lg p-4 mb-4 grid grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs text-slate-500 mb-1">期別名稱</label>
            <input name="name" required placeholder="簽約款" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">順序</label>
            <input type="number" name="sequence" defaultValue={1} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">比例 %</label>
            <input type="number" step="0.1" name="percentage" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">金額</label>
            <input type="number" name="amount" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">預定日</label>
            <input type="date" name="dueDate" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="col-span-5">
            <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">儲存</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">期別</th>
              <th className="text-left px-3 py-2 font-medium">比例</th>
              <th className="text-left px-3 py-2 font-medium">金額</th>
              <th className="text-left px-3 py-2 font-medium">預定日</th>
              <th className="text-left px-3 py-2 font-medium">實收日</th>
              <th className="text-left px-3 py-2 font-medium">狀態</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {payments
              .slice()
              .sort((a, b) => a.sequence - b.sequence)
              .map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{p.name}</td>
                  <td className="px-3 py-2 text-slate-600">{p.percentage ? `${p.percentage}%` : "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{fmt(Number(p.amount))}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{p.dueDate || "-"}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{p.paidDate || "-"}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    {p.status !== "PAID" && (
                      <button
                        onClick={() => markPaid(p.id, "PAID")}
                        className="text-xs text-green-700 hover:underline"
                      >
                        標記已收
                      </button>
                    )}
                    <button onClick={() => del(p.id)} className="text-xs text-slate-400 hover:text-red-600">
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  尚無收款期別
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Expenses ----------------

function ExpensesTab({
  projectId,
  expenses,
  trades,
  vendors,
  onChanged,
}: {
  projectId: string;
  expenses: Expense[];
  trades: Trade[];
  vendors: Vendor[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  async function addExpense(formData: FormData) {
    await fetch(`/api/projects/${projectId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: formData.get("description"),
        tradeId: formData.get("tradeId") || null,
        vendorId: formData.get("vendorId") || null,
        amount: Number(formData.get("amount")),
        expenseDate: formData.get("expenseDate") || null,
      }),
    });
    setShowForm(false);
    onChanged();
  }

  async function del(id: string) {
    await fetch(`/api/projects/${projectId}/expenses/${id}`, { method: "DELETE" });
    onChanged();
  }

  async function togglePaid(id: string, status: string) {
    await fetch(`/api/projects/${projectId}/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: status }),
    });
    onChanged();
  }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-slate-500">費用合計 {fmt(total)}</div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
        >
          + 新增費用
        </button>
      </div>

      {showForm && (
        <form
          action={addExpense}
          className="bg-white border border-slate-200 rounded-lg p-4 mb-4 grid grid-cols-5 gap-3 items-end"
        >
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">項目說明</label>
            <input name="description" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">工種</label>
            <select name="tradeId" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
              <option value="">-</option>
              {trades.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">廠商</label>
            <select name="vendorId" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
              <option value="">-</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">金額</label>
            <input type="number" name="amount" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">日期</label>
            <input type="date" name="expenseDate" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="col-span-5">
            <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">儲存</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">說明</th>
              <th className="text-left px-3 py-2 font-medium">工種</th>
              <th className="text-left px-3 py-2 font-medium">廠商</th>
              <th className="text-left px-3 py-2 font-medium">金額</th>
              <th className="text-left px-3 py-2 font-medium">日期</th>
              <th className="text-left px-3 py-2 font-medium">付款狀態</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{e.description}</td>
                <td className="px-3 py-2 text-slate-600">
                  {trades.find((t) => t.id === e.tradeId)?.name || "-"}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {vendors.find((v) => v.id === e.vendorId)?.name || "-"}
                </td>
                <td className="px-3 py-2 text-slate-600">{fmt(Number(e.amount))}</td>
                <td className="px-3 py-2 text-slate-500 text-xs">{e.expenseDate || "-"}</td>
                <td className="px-3 py-2">
                  <select
                    defaultValue={e.paymentStatus}
                    onChange={(ev) => togglePaid(e.id, ev.target.value)}
                    className={`text-xs rounded-full px-2 py-1 border-0 ${STATUS_COLOR[e.paymentStatus]}`}
                  >
                    {(["PENDING", "PAID", "OVERDUE"] as const).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => del(e.id)} className="text-xs text-slate-400 hover:text-red-600">
                    刪除
                  </button>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  尚無費用紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Change Orders ----------------

function ChangeOrdersTab({
  projectId,
  changeOrders,
  onChanged,
}: {
  projectId: string;
  changeOrders: ChangeOrder[];
  onChanged: () => void;
}) {
  const [showForm, setShowForm] = useState(false);

  async function addCO(formData: FormData) {
    await fetch(`/api/projects/${projectId}/change-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: formData.get("description"),
        amount: Number(formData.get("amount")),
      }),
    });
    setShowForm(false);
    onChanged();
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/projects/${projectId}/change-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChanged();
  }

  async function del(id: string) {
    await fetch(`/api/projects/${projectId}/change-orders/${id}`, { method: "DELETE" });
    onChanged();
  }

  const net = changeOrders
    .filter((c) => c.status !== "REJECTED")
    .reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-slate-500">
          淨追加減 <span className={net >= 0 ? "text-green-600" : "text-red-600"}>{fmt(net)}</span>（不含已駁回）
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800"
        >
          + 新增追加減項目
        </button>
      </div>

      {showForm && (
        <form
          action={addCO}
          className="bg-white border border-slate-200 rounded-lg p-4 mb-4 grid grid-cols-4 gap-3 items-end"
        >
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">項目說明</label>
            <input name="description" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">金額（減項請輸入負數）</label>
            <input type="number" name="amount" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">儲存</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">說明</th>
              <th className="text-left px-3 py-2 font-medium">金額</th>
              <th className="text-left px-3 py-2 font-medium">狀態</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {changeOrders.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{c.description}</td>
                <td className={`px-3 py-2 ${Number(c.amount) >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {fmt(Number(c.amount))}
                </td>
                <td className="px-3 py-2">
                  <select
                    defaultValue={c.status}
                    onChange={(e) => setStatus(c.id, e.target.value)}
                    className={`text-xs rounded-full px-2 py-1 border-0 ${STATUS_COLOR[c.status]}`}
                  >
                    {(["PROPOSED", "APPROVED", "REJECTED"] as const).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => del(c.id)} className="text-xs text-slate-400 hover:text-red-600">
                    刪除
                  </button>
                </td>
              </tr>
            ))}
            {changeOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-400">
                  尚無追加減項目
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- Profit ----------------

function ProfitTab({
  contractAmount,
  changeOrderNet,
  receivable,
  totalExpense,
  profit,
  margin,
  expenses,
  trades,
}: {
  contractAmount: number;
  changeOrderNet: number;
  receivable: number;
  totalExpense: number;
  profit: number;
  margin: number;
  expenses: Expense[];
  trades: Trade[];
}) {
  const byTrade = trades
    .map((t) => ({
      name: t.name,
      total: expenses.filter((e) => e.tradeId === t.id).reduce((s, e) => s + Number(e.amount), 0),
    }))
    .filter((r) => r.total > 0);
  const untracked = expenses
    .filter((e) => !e.tradeId)
    .reduce((s, e) => s + Number(e.amount), 0);
  if (untracked > 0) byTrade.push({ name: "未分類", total: untracked });

  const tax = receivable * 0.05;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="text-sm font-medium text-slate-900 mb-4">利潤計算</div>
        <div className="space-y-2 text-sm max-w-md">
          <Row label="合約金額" value={fmt(contractAmount)} />
          <Row label="追加減淨額" value={fmt(changeOrderNet)} tone={changeOrderNet >= 0 ? "green" : "red"} />
          <Row label="應收總額" value={fmt(receivable)} bold />
          <Row label="實際費用合計" value={`- ${fmt(totalExpense)}`} tone="red" />
          <div className="border-t border-slate-200 my-2" />
          <Row label="毛利" value={fmt(profit)} bold tone={profit >= 0 ? "green" : "red"} />
          <Row label="毛利率" value={`${margin.toFixed(1)}%`} />
          <div className="border-t border-dashed border-slate-200 my-2" />
          <Row label="營業稅（5%，未稅估算）" value={fmt(tax)} tone="red" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="text-sm font-medium text-slate-900 mb-3">費用依工種分佈</div>
        <div className="space-y-2">
          {byTrade.map((r) => (
            <div key={r.name} className="flex items-center gap-3 text-sm">
              <div className="w-20 text-slate-600">{r.name}</div>
              <div className="flex-1 bg-slate-100 rounded h-3 relative">
                <div
                  className="absolute h-3 bg-slate-700 rounded"
                  style={{ width: `${totalExpense > 0 ? (r.total / totalExpense) * 100 : 0}%` }}
                />
              </div>
              <div className="w-28 text-right text-slate-600">{fmt(r.total)}</div>
            </div>
          ))}
          {byTrade.length === 0 && <div className="text-slate-400 text-sm">尚無費用資料</div>}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "green" | "red";
}) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span
        className={`${bold ? "font-semibold" : ""} ${
          tone === "green" ? "text-green-600" : tone === "red" ? "text-red-600" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
