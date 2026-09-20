export type Trade = { id: string; name: string };
export type Vendor = { id: string; name: string; tradeId: string | null };

export type ConstructionTask = {
  id: string;
  name: string;
  tradeId: string | null;
  vendorId: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  progressPct: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "DELAYED";
};

export type PaymentSchedule = {
  id: string;
  name: string;
  sequence: number;
  percentage: string | null;
  amount: string;
  dueDate: string | null;
  paidDate: string | null;
  status: "PENDING" | "PAID" | "OVERDUE";
};

export type Expense = {
  id: string;
  description: string;
  tradeId: string | null;
  vendorId: string | null;
  amount: string;
  expenseDate: string | null;
  paymentStatus: "PENDING" | "PAID" | "OVERDUE";
};

export type ChangeOrder = {
  id: string;
  description: string;
  amount: string;
  status: "PROPOSED" | "APPROVED" | "REJECTED";
};

export type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  contractAmount: string | null;
  taxIncluded: boolean;
  startDate: string | null;
  endDate: string | null;
  customerName: string | null;
};
