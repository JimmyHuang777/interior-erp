"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Trade = { id: string; name: string };
type Material = { id: string; name: string; unitPrice: string | null; unit: string | null };
type QuoteItem = {
  id: string;
  itemName: string;
  tradeId: string | null;
  materialId: string | null;
  unit: string | null;
  quantity: string;
  unitPrice: string;
};

function fmt(n: number) {
  return "NT$ " + Math.round(n).toLocaleString();
}

export default function QuoteEditor({
  projectId,
  initialItems,
  trades,
  materials,
}: {
  projectId: string;
  initialItems: QuoteItem[];
  trades: Trade[];
  materials: Material[];
}) {
  const router = useRouter();
  const [pendingMaterialId, setPendingMaterialId] = useState<string>("");

  async function addItem(formData: FormData) {
    const materialId = formData.get("materialId") as string;
    const material = materials.find((m) => m.id === materialId);

    await fetch(`/api/projects/${projectId}/quote-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: formData.get("itemName"),
        tradeId: formData.get("tradeId") || null,
        materialId: materialId || null,
        unit: (formData.get("unit") as string) || material?.unit || null,
        quantity: Number(formData.get("quantity") || 0),
        unitPrice: Number(formData.get("unitPrice") || material?.unitPrice || 0),
      }),
    });
    setPendingMaterialId("");
    router.refresh();
  }

  async function del(id: string) {
    await fetch(`/api/projects/${projectId}/quote-items/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const total = initialItems.reduce(
    (s, i) => s + Number(i.quantity) * Number(i.unitPrice),
    0,
  );

  const selectedMaterial = materials.find((m) => m.id === pendingMaterialId);

  return (
    <div>
      <form
        action={addItem}
        className="bg-white border border-slate-200 rounded-lg p-4 mb-6 grid grid-cols-6 gap-3 items-end"
      >
        <div className="col-span-2">
          <label className="block text-xs text-slate-500 mb-1">工項名稱</label>
          <input name="itemName" required className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
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
          <label className="block text-xs text-slate-500 mb-1">材料（自動帶單價）</label>
          <select
            name="materialId"
            value={pendingMaterialId}
            onChange={(e) => setPendingMaterialId(e.target.value)}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="">-</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">數量</label>
          <input type="number" step="0.01" name="quantity" defaultValue={1} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">單價</label>
          <input
            type="number"
            name="unitPrice"
            key={pendingMaterialId}
            defaultValue={selectedMaterial?.unitPrice ?? ""}
            className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
          />
        </div>
        <input type="hidden" name="unit" value={selectedMaterial?.unit ?? ""} />
        <div className="col-span-6">
          <button className="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800">
            新增工項
          </button>
        </div>
      </form>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">工項</th>
              <th className="text-left px-3 py-2 font-medium">工種</th>
              <th className="text-left px-3 py-2 font-medium">單位</th>
              <th className="text-left px-3 py-2 font-medium">數量</th>
              <th className="text-left px-3 py-2 font-medium">單價</th>
              <th className="text-left px-3 py-2 font-medium">小計</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {initialItems.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">{i.itemName}</td>
                <td className="px-3 py-2 text-slate-600">
                  {trades.find((t) => t.id === i.tradeId)?.name || "-"}
                </td>
                <td className="px-3 py-2 text-slate-600">{i.unit || "-"}</td>
                <td className="px-3 py-2 text-slate-600">{i.quantity}</td>
                <td className="px-3 py-2 text-slate-600">{fmt(Number(i.unitPrice))}</td>
                <td className="px-3 py-2 text-slate-900 font-medium">
                  {fmt(Number(i.quantity) * Number(i.unitPrice))}
                </td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => del(i.id)} className="text-xs text-slate-400 hover:text-red-600">
                    刪除
                  </button>
                </td>
              </tr>
            ))}
            {initialItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  尚無報價項目
                </td>
              </tr>
            )}
          </tbody>
          {initialItems.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td colSpan={5} className="px-3 py-2 text-right text-slate-600 font-medium">
                  合計
                </td>
                <td colSpan={2} className="px-3 py-2 font-semibold text-slate-900">
                  {fmt(total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
