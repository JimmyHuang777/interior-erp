export type Trade = { id: string; name: string };
export type Material = { id: string; name: string; unitPrice: string | null; unit: string | null };

export type QuoteVersion = {
  id: string;
  name: string;
  costMultiplier: string;
};

export type QuoteItem = {
  id: string;
  tradeId: string | null;
  itemName: string;
  unit: string | null;
  quantity: string;
  unitPrice: string; // 成本單價
  ownerUnitPrice: string | null; // null = 自動換算
  notes: string | null;
  colorTag: string | null;
};

export type QuoteChangeOrder = {
  id: string;
  itemName: string;
  quantity: string;
  unit: string | null;
  unitPrice: string;
  ownerUnitPrice: string | null;
  notes: string | null;
};

export const COLOR_DOTS = [
  { key: "gray", hex: "#94a3b8" },
  { key: "red", hex: "#f87171" },
  { key: "orange", hex: "#fb923c" },
  { key: "green", hex: "#4ade80" },
  { key: "blue", hex: "#60a5fa" },
  { key: "purple", hex: "#c084fc" },
];

export function fmt(n: number) {
  return "NT$ " + Math.round(n).toLocaleString();
}
