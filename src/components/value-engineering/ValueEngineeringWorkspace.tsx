"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Trade, Material, QuoteVersion, QuoteItem, QuoteChangeOrder } from "./types";
import { fmt, COLOR_DOTS } from "./types";

const TABS = [
  { key: "cost", label: "成本估價單" },
  { key: "owner", label: "業主估價單" },
  { key: "changeOrders", label: "追加減單" },
  { key: "analysis", label: "成本分析表" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function ValueEngineeringWorkspace({
  projectId,
  versions,
  activeVersionId,
  items,
  changeOrders,
  trades,
  materials,
}: {
  projectId: string;
  versions: QuoteVersion[];
  activeVersionId: string;
  items: QuoteItem[];
  changeOrders: QuoteChangeOrder[];
  trades: Trade[];
  materials: Material[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("cost");
  const [extraTradeIds, setExtraTradeIds] = useState<string[]>([]);
  const version = versions.find((v) => v.id === activeVersionId)!;
  const multiplier = Number(version.costMultiplier);

  function goVersion(id: string) {
    router.push(`/dashboard/value-engineering?projectId=${projectId}&versionId=${id}`);
  }

  async function addVersion() {
    const res = await fetch(`/api/projects/${projectId}/quote-versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const v = await res.json();
    goVersion(v.id);
  }

  async function duplicateVersion() {
    const res = await fetch(
      `/api/projects/${projectId}/quote-versions/${activeVersionId}/duplicate`,
      { method: "POST" },
    );
    const v = await res.json();
    goVersion(v.id);
  }

  async function renameVersion() {
    const name = prompt("版本名稱", version.name);
    if (!name) return;
    await fetch(`/api/projects/${projectId}/quote-versions/${activeVersionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    router.refresh();
  }

  async function updateMultiplier(value: number) {
    await fetch(`/api/projects/${projectId}/quote-versions/${activeVersionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costMultiplier: value }),
    });
    router.refresh();
  }

  async function resetAllOwnerPrices() {
    if (!confirm("確定要把本版本所有業主單價還原為自動換算嗎？")) return;
    await Promise.all(
      items
        .filter((i) => i.ownerUnitPrice != null)
        .map((i) =>
          fetch(`/api/quote-versions/${activeVersionId}/items/${i.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ownerUnitPrice: null }),
          }),
        ),
    );
    router.refresh();
  }

  function exportCSV() {
    const rows = [["工種", "項目", "數量", "單位", "成本單價", "業主單價", "備註"]];
    items.forEach((i) => {
      const owner = i.ownerUnitPrice != null ? Number(i.ownerUnitPrice) : Number(i.unitPrice) * multiplier;
      rows.push([
        trades.find((t) => t.id === i.tradeId)?.name || "未分類",
        i.itemName,
        i.quantity,
        i.unit || "",
        i.unitPrice,
        owner.toFixed(0),
        i.notes || "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${version.name}-估價單.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    window.print();
  }

  const groupTradeIds = useMemo(() => {
    const ids = new Set<string>();
    items.forEach((i) => i.tradeId && ids.add(i.tradeId));
    extraTradeIds.forEach((id) => ids.add(id));
    return trades.filter((t) => ids.has(t.id)).map((t) => t.id);
  }, [items, extraTradeIds, trades]);

  const hasUncategorized = items.some((i) => !i.tradeId);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 no-print">
        <label className="text-xs text-slate-500">估價版本</label>
        <select
          value={activeVersionId}
          onChange={(e) => goVersion(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1.5 text-sm"
        >
          {versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <button onClick={renameVersion} className="text-xs border border-slate-300 rounded px-2 py-1.5 hover:bg-slate-50">
          改名
        </button>
        <button onClick={duplicateVersion} className="text-xs border border-slate-300 rounded px-2 py-1.5 hover:bg-slate-50">
          + 複製版本
        </button>
        <button onClick={addVersion} className="text-xs border border-slate-300 rounded px-2 py-1.5 hover:bg-slate-50">
          + 新版本
        </button>
        <div className="flex-1" />
        <button onClick={exportCSV} className="text-xs border border-slate-300 rounded px-2 py-1.5 hover:bg-slate-50">
          ↓ CSV
        </button>
        <button onClick={exportPDF} className="text-xs bg-slate-900 text-white rounded px-3 py-1.5 hover:bg-slate-800">
          ↓ 匯出 PDF
        </button>
      </div>

      <div className="border-b border-slate-200 mb-6 flex gap-1 no-print">
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

      {tab === "cost" && (
        <ItemsSheet
          mode="cost"
          versionId={activeVersionId}
          items={items}
          trades={trades}
          materials={materials}
          multiplier={multiplier}
          groupTradeIds={groupTradeIds}
          hasUncategorized={hasUncategorized}
          onAddCategory={(id) => setExtraTradeIds((prev) => [...prev, id])}
          onChanged={() => router.refresh()}
        />
      )}

      {tab === "owner" && (
        <div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 mb-4 flex items-center gap-3 no-print">
            <label className="text-sm text-slate-600">成本倍率</label>
            <input
              type="number"
              step="0.01"
              defaultValue={multiplier}
              onBlur={(e) => {
                const v = Number(e.target.value);
                if (v > 0 && v !== multiplier) updateMultiplier(v);
              }}
              className="w-24 border border-slate-300 rounded px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-slate-400">（未手動調整的項目自動套用）</span>
            <div className="flex-1" />
            <button onClick={resetAllOwnerPrices} className="text-xs border border-slate-300 rounded px-2 py-1.5 hover:bg-slate-50">
              ↺ 全部還原
            </button>
          </div>
          <ItemsSheet
            mode="owner"
            versionId={activeVersionId}
            items={items}
            trades={trades}
            materials={materials}
            multiplier={multiplier}
            groupTradeIds={groupTradeIds}
            hasUncategorized={hasUncategorized}
            onAddCategory={(id) => setExtraTradeIds((prev) => [...prev, id])}
            onChanged={() => router.refresh()}
          />
        </div>
      )}

      {tab === "changeOrders" && (
        <ChangeOrdersSheet
          versionId={activeVersionId}
          changeOrders={changeOrders}
          multiplier={multiplier}
          onChanged={() => router.refresh()}
        />
      )}

      {tab === "analysis" && (
        <AnalysisSheet
          items={items}
          changeOrders={changeOrders}
          trades={trades}
          multiplier={multiplier}
        />
      )}
    </div>
  );
}

// ---------------- Items sheet (shared by cost / owner) ----------------

function ownerPriceOf(i: QuoteItem, multiplier: number) {
  return i.ownerUnitPrice != null ? Number(i.ownerUnitPrice) : Number(i.unitPrice) * multiplier;
}

function ItemsSheet({
  mode,
  versionId,
  items,
  trades,
  materials,
  multiplier,
  groupTradeIds,
  hasUncategorized,
  onAddCategory,
  onChanged,
}: {
  mode: "cost" | "owner";
  versionId: string;
  items: QuoteItem[];
  trades: Trade[];
  materials: Material[];
  multiplier: number;
  groupTradeIds: string[];
  hasUncategorized: boolean;
  onAddCategory: (tradeId: string) => void;
  onChanged: () => void;
}) {
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newTradeName, setNewTradeName] = useState("");

  const usedTradeIds = new Set([...groupTradeIds]);
  const availableTrades = trades.filter((t) => !usedTradeIds.has(t.id));

  async function addExistingCategory(tradeId: string) {
    onAddCategory(tradeId);
    setShowAddCategory(false);
  }

  async function addNewCategory() {
    if (!newTradeName.trim()) return;
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTradeName.trim() }),
    });
    const t = await res.json();
    onAddCategory(t.id);
    setNewTradeName("");
    setShowAddCategory(false);
    onChanged();
  }

  const grandTotal = items.reduce((s, i) => {
    const price = mode === "cost" ? Number(i.unitPrice) : ownerPriceOf(i, multiplier);
    return s + Number(i.quantity) * price;
  }, 0);

  return (
    <div>
      {groupTradeIds.map((tradeId) => (
        <TradeGroup
          key={tradeId}
          mode={mode}
          versionId={versionId}
          trade={trades.find((t) => t.id === tradeId)!}
          items={items.filter((i) => i.tradeId === tradeId)}
          materials={materials}
          multiplier={multiplier}
          onChanged={onChanged}
        />
      ))}

      {hasUncategorized && (
        <TradeGroup
          mode={mode}
          versionId={versionId}
          trade={null}
          items={items.filter((i) => !i.tradeId)}
          materials={materials}
          multiplier={multiplier}
          onChanged={onChanged}
        />
      )}

      <div className="no-print mb-6">
        {!showAddCategory ? (
          <button
            onClick={() => setShowAddCategory(true)}
            className="text-sm border border-dashed border-slate-300 rounded-lg px-4 py-2 text-slate-500 hover:border-slate-400 hover:text-slate-700 w-full text-left"
          >
            + 新增工種分類
          </button>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap gap-3 items-center">
            {availableTrades.length > 0 && (
              <select
                onChange={(e) => e.target.value && addExistingCategory(e.target.value)}
                defaultValue=""
                className="border border-slate-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="">選擇既有工種...</option>
                {availableTrades.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            <span className="text-xs text-slate-400">或</span>
            <input
              value={newTradeName}
              onChange={(e) => setNewTradeName(e.target.value)}
              placeholder="輸入新工種名稱，例如：假設工程"
              className="border border-slate-300 rounded px-2 py-1.5 text-sm"
            />
            <button onClick={addNewCategory} className="text-sm bg-slate-900 text-white rounded px-3 py-1.5 hover:bg-slate-800">
              新增
            </button>
            <button onClick={() => setShowAddCategory(false)} className="text-sm text-slate-400 hover:text-slate-700">
              取消
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">
          {mode === "cost" ? "成本總計" : "業主總計"}
        </span>
        <span className="text-lg font-semibold text-slate-900">{fmt(grandTotal)}</span>
      </div>
    </div>
  );
}

function TradeGroup({
  mode,
  versionId,
  trade,
  items,
  materials,
  multiplier,
  onChanged,
}: {
  mode: "cost" | "owner";
  versionId: string;
  trade: Trade | null;
  items: QuoteItem[];
  materials: Material[];
  multiplier: number;
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);

  const subtotal = items.reduce((s, i) => {
    const price = mode === "cost" ? Number(i.unitPrice) : ownerPriceOf(i, multiplier);
    return s + Number(i.quantity) * price;
  }, 0);

  async function addItem(formData: FormData) {
    const materialId = formData.get("materialId") as string;
    const material = materials.find((m) => m.id === materialId);
    await fetch(`/api/quote-versions/${versionId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: formData.get("itemName"),
        tradeId: trade?.id || null,
        materialId: materialId || null,
        quantity: Number(formData.get("quantity") || 1),
        unit: (formData.get("unit") as string) || material?.unit || null,
        unitPrice: Number(formData.get("unitPrice") || material?.unitPrice || 0),
        notes: (formData.get("notes") as string) || null,
      }),
    });
    setAdding(false);
    onChanged();
  }

  async function updateItem(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/quote-versions/${versionId}/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    onChanged();
  }

  async function deleteItem(id: string) {
    await fetch(`/api/quote-versions/${versionId}/items/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="mb-6 break-inside-avoid">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="font-medium text-slate-900">{trade?.name || "未分類"}</h3>
        <span className="text-sm text-slate-500">小計 {fmt(subtotal)}</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">色</th>
              <th className="text-left px-3 py-2 font-medium">項目</th>
              <th className="text-left px-3 py-2 font-medium">數量</th>
              <th className="text-left px-3 py-2 font-medium">單位</th>
              <th className="text-left px-3 py-2 font-medium">
                {mode === "cost" ? "成本單價" : "業主單價"}
              </th>
              <th className="text-left px-3 py-2 font-medium">小計</th>
              <th className="text-left px-3 py-2 font-medium">備註</th>
              <th className="px-3 py-2 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const price = mode === "cost" ? Number(i.unitPrice) : ownerPriceOf(i, multiplier);
              const adjusted = mode === "owner" && i.ownerUnitPrice != null;
              return (
                <tr key={i.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <div className="flex gap-1 no-print">
                      {COLOR_DOTS.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => updateItem(i.id, { colorTag: c.key })}
                          className={`w-3 h-3 rounded-full ${i.colorTag === c.key ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    {i.colorTag && (
                      <span
                        className="hidden print:inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: COLOR_DOTS.find((c) => c.key === i.colorTag)?.hex }}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">{i.itemName}</td>
                  <td className="px-3 py-2 text-slate-600">
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={i.quantity}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== Number(i.quantity)) updateItem(i.id, { quantity: v });
                      }}
                      className="w-16 border border-slate-200 rounded px-1.5 py-1 text-sm no-print"
                    />
                    <span className="hidden print:inline">{i.quantity}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{i.unit || "-"}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      defaultValue={price}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v === price) return;
                        if (mode === "cost") updateItem(i.id, { unitPrice: v });
                        else updateItem(i.id, { ownerUnitPrice: v });
                      }}
                      className={`w-24 border rounded px-1.5 py-1 text-sm no-print ${
                        adjusted ? "border-amber-400 bg-amber-50" : "border-slate-200"
                      }`}
                    />
                    <span className="hidden print:inline">{price.toFixed(0)}</span>
                    {adjusted && (
                      <button
                        onClick={() => updateItem(i.id, { ownerUnitPrice: null })}
                        className="ml-1 text-[10px] text-amber-600 no-print"
                        title="還原自動換算"
                      >
                        已調整 ↺
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {fmt(Number(i.quantity) * price)}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">
                    <input
                      defaultValue={i.notes || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (i.notes || "")) updateItem(i.id, { notes: e.target.value || null });
                      }}
                      className="w-28 border border-slate-200 rounded px-1.5 py-1 text-xs no-print"
                    />
                    <span className="hidden print:inline">{i.notes}</span>
                  </td>
                  <td className="px-3 py-2 text-right no-print">
                    <button onClick={() => deleteItem(i.id)} className="text-xs text-slate-400 hover:text-red-600">
                      刪除
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-slate-400 text-xs">
                  尚無子項目
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="no-print w-full text-left text-xs text-slate-500 hover:text-slate-800 px-3 py-2 border-t border-slate-100"
          >
            + 新增子項目
          </button>
        ) : (
          <form
            action={addItem}
            className="no-print border-t border-slate-100 p-3 grid grid-cols-6 gap-2 items-end bg-slate-50"
          >
            <div className="col-span-2">
              <input name="itemName" required placeholder="項目名稱" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <input type="number" step="0.01" name="quantity" defaultValue={1} placeholder="數量" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <input name="unit" placeholder="單位" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <input type="number" name="unitPrice" placeholder="成本單價" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <select name="materialId" className="border border-slate-300 rounded px-2 py-1.5 text-sm">
              <option value="">材料(選填)</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input name="notes" placeholder="備註" className="col-span-2 border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <div className="flex gap-2">
              <button className="text-sm bg-slate-900 text-white rounded px-3 py-1.5 hover:bg-slate-800">新增</button>
              <button type="button" onClick={() => setAdding(false)} className="text-sm text-slate-400 hover:text-slate-700">
                取消
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------- Change orders ----------------

function coOwnerPrice(c: QuoteChangeOrder, multiplier: number) {
  return c.ownerUnitPrice != null ? Number(c.ownerUnitPrice) : Number(c.unitPrice) * multiplier;
}

function ChangeOrdersSheet({
  versionId,
  changeOrders,
  multiplier,
  onChanged,
}: {
  versionId: string;
  changeOrders: QuoteChangeOrder[];
  multiplier: number;
  onChanged: () => void;
}) {
  const [view, setView] = useState<"cost" | "owner">("cost");
  const [showForm, setShowForm] = useState(false);

  async function addCO(formData: FormData) {
    await fetch(`/api/quote-versions/${versionId}/change-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemName: formData.get("itemName"),
        quantity: Number(formData.get("quantity") || 1),
        unit: (formData.get("unit") as string) || null,
        unitPrice: Number(formData.get("unitPrice") || 0),
        notes: (formData.get("notes") as string) || null,
      }),
    });
    setShowForm(false);
    onChanged();
  }

  async function updateCO(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/quote-versions/${versionId}/change-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    onChanged();
  }

  async function del(id: string) {
    await fetch(`/api/quote-versions/${versionId}/change-orders/${id}`, { method: "DELETE" });
    onChanged();
  }

  const total = changeOrders.reduce((s, c) => {
    const price = view === "cost" ? Number(c.unitPrice) : coOwnerPrice(c, multiplier);
    return s + Number(c.quantity) * price;
  }, 0);

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">在成本版輸入追加/減項，業主版自動帶入可調整</p>
      <div className="flex gap-1 mb-4 no-print">
        <button
          onClick={() => setView("cost")}
          className={`px-3 py-1.5 text-sm rounded-md ${view === "cost" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          成本版
        </button>
        <button
          onClick={() => setView("owner")}
          className={`px-3 py-1.5 text-sm rounded-md ${view === "owner" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          業主版
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left px-3 py-2 font-medium">工項名稱</th>
              <th className="text-left px-3 py-2 font-medium">數量</th>
              <th className="text-left px-3 py-2 font-medium">單位</th>
              <th className="text-left px-3 py-2 font-medium">{view === "cost" ? "成本單價" : "業主單價"}</th>
              <th className="text-left px-3 py-2 font-medium">小計</th>
              <th className="text-left px-3 py-2 font-medium">備註</th>
              <th className="px-3 py-2 no-print"></th>
            </tr>
          </thead>
          <tbody>
            {changeOrders.map((c) => {
              const price = view === "cost" ? Number(c.unitPrice) : coOwnerPrice(c, multiplier);
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{c.itemName}</td>
                  <td className="px-3 py-2 text-slate-600">{c.quantity}</td>
                  <td className="px-3 py-2 text-slate-600">{c.unit || "-"}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      defaultValue={price}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v === price) return;
                        if (view === "cost") updateCO(c.id, { unitPrice: v });
                        else updateCO(c.id, { ownerUnitPrice: v });
                      }}
                      className="w-24 border border-slate-200 rounded px-1.5 py-1 text-sm no-print"
                    />
                    <span className="hidden print:inline">{price.toFixed(0)}</span>
                  </td>
                  <td className={`px-3 py-2 font-medium ${Number(c.quantity) * price >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {fmt(Number(c.quantity) * price)}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs">{c.notes || "-"}</td>
                  <td className="px-3 py-2 text-right no-print">
                    <button onClick={() => del(c.id)} className="text-xs text-slate-400 hover:text-red-600">
                      刪除
                    </button>
                  </td>
                </tr>
              );
            })}
            {changeOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  尚無追加減項目
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="no-print w-full text-left text-xs text-slate-500 hover:text-slate-800 px-3 py-2 border-t border-slate-100"
          >
            + 新增追加減項目
          </button>
        ) : (
          <form action={addCO} className="no-print border-t border-slate-100 p-3 grid grid-cols-5 gap-2 items-end bg-slate-50">
            <div className="col-span-2">
              <input name="itemName" required placeholder="項目名稱" className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <input type="number" step="0.01" name="quantity" defaultValue={1} placeholder="數量" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <input name="unit" placeholder="單位" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <input type="number" name="unitPrice" placeholder="成本單價(減項用負數)" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <input name="notes" placeholder="備註" className="col-span-4 border border-slate-300 rounded px-2 py-1.5 text-sm" />
            <div className="flex gap-2">
              <button className="text-sm bg-slate-900 text-white rounded px-3 py-1.5 hover:bg-slate-800">新增</button>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-400 hover:text-slate-700">
                取消
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700">{view === "cost" ? "成本合計" : "業主合計"}</span>
        <span className={`text-lg font-semibold ${total >= 0 ? "text-slate-900" : "text-red-600"}`}>{fmt(total)}</span>
      </div>
    </div>
  );
}

// ---------------- Analysis ----------------

function marginLabel(pct: number) {
  if (pct < 10) return { text: "偏低", color: "text-red-600" };
  if (pct < 30) return { text: "普通", color: "text-amber-600" };
  return { text: "良好", color: "text-green-600" };
}

function AnalysisSheet({
  items,
  changeOrders,
  trades,
  multiplier,
}: {
  items: QuoteItem[];
  changeOrders: QuoteChangeOrder[];
  trades: Trade[];
  multiplier: number;
}) {
  const itemsCost = items.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
  const itemsOwner = items.reduce((s, i) => s + Number(i.quantity) * ownerPriceOf(i, multiplier), 0);
  const coCost = changeOrders.reduce((s, c) => s + Number(c.quantity) * Number(c.unitPrice), 0);
  const coOwner = changeOrders.reduce((s, c) => s + Number(c.quantity) * coOwnerPrice(c, multiplier), 0);

  const costTotal = itemsCost + coCost;
  const ownerTotal = itemsOwner + coOwner;
  const costWithTax = costTotal * 1.05;
  const ownerUntaxed = ownerTotal / 1.05;
  const profit = ownerTotal - costWithTax;
  const marginPct = ownerTotal > 0 ? (profit / ownerTotal) * 100 : 0;
  const overall = marginLabel(marginPct);

  const byTrade = trades
    .map((t) => {
      const tradeItems = items.filter((i) => i.tradeId === t.id);
      const cost = tradeItems.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
      const owner = tradeItems.reduce((s, i) => s + Number(i.quantity) * ownerPriceOf(i, multiplier), 0);
      return { name: t.name, cost, owner, profit: owner - cost, margin: owner > 0 ? ((owner - cost) / owner) * 100 : 0 };
    })
    .filter((r) => r.cost > 0 || r.owner > 0);

  const uncategorized = items.filter((i) => !i.tradeId);
  if (uncategorized.length > 0) {
    const cost = uncategorized.reduce((s, i) => s + Number(i.quantity) * Number(i.unitPrice), 0);
    const owner = uncategorized.reduce((s, i) => s + Number(i.quantity) * ownerPriceOf(i, multiplier), 0);
    byTrade.push({ name: "未分類", cost, owner, profit: owner - cost, margin: owner > 0 ? ((owner - cost) / owner) * 100 : 0 });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="text-sm text-slate-500 mb-1">整體獲利率</div>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-3xl font-semibold text-slate-900">{marginPct.toFixed(1)}%</span>
          <span className="text-sm text-slate-500">
            總利潤 {fmt(profit)} / 業主總價 {fmt(ownerTotal)}
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
          <div
            className="h-2 bg-slate-800 rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, (marginPct / 50) * 100))}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>0%</span>
          <span>15%</span>
          <span>50%</span>
        </div>
        <div className={`text-xs mt-1 ${overall.color}`}>✓ 獲利{overall.text}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
          <div className="text-xs text-slate-500">成本合計（未稅）</div>
          <div className="text-xl font-semibold text-red-600">{fmt(costTotal)}</div>
          <div className="text-xs text-slate-400">{fmt(costTotal)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="text-xs text-slate-500">業主最終總價</div>
          <div className="text-xl font-semibold text-blue-700">{fmt(ownerTotal)}</div>
          <div className="text-xs text-slate-400">未稅 {fmt(ownerUntaxed)}</div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="text-xs text-slate-500">總利潤（業主總價 − 成本含稅）</div>
          <div className="text-xl font-semibold text-green-700">{fmt(profit)}</div>
          <div className="text-xs text-slate-400">獲利率 {marginPct.toFixed(1)}%</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="text-xs text-slate-500">成本含稅</div>
          <div className="text-xl font-semibold text-slate-900">{fmt(costWithTax)}</div>
          <div className="text-xs text-slate-400">未稅 {fmt(costTotal)}</div>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-slate-900 mb-3">各工種分析</div>
        <div className="space-y-3">
          {byTrade.map((r) => (
            <div key={r.name} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-slate-900">{r.name}</span>
                <span className="text-sm text-slate-500">
                  成本 {r.cost.toLocaleString()}　業主 {r.owner.toLocaleString()}　利潤 {fmt(r.profit)}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                <div
                  className="h-2 bg-amber-400 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, r.margin))}%` }}
                />
              </div>
              <div className={`text-xs ${marginLabel(r.margin).color}`}>
                {r.margin.toFixed(1)}% {marginLabel(r.margin).text}
              </div>
            </div>
          ))}
          {byTrade.length === 0 && <div className="text-slate-400 text-sm">尚無資料</div>}
        </div>
      </div>
    </div>
  );
}
