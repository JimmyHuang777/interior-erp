import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  date,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------- enums ----------
export const userRoleEnum = pgEnum("user_role", [
  "ADMIN", // 管理者
  "DESIGNER", // 設計師
  "SITE", // 工務
  "HR", // 行政/HR
]);

export const projectStatusEnum = pgEnum("project_status", [
  "INQUIRY", // 洽談中
  "DESIGN", // 設計中
  "CONTRACTED", // 已簽約
  "CONSTRUCTION", // 施工中
  "COMPLETED", // 已完工
  "WARRANTY", // 保固中
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "PAID",
  "OVERDUE",
]);

export const changeOrderStatusEnum = pgEnum("change_order_status", [
  "PROPOSED",
  "APPROVED",
  "REJECTED",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "DONE",
  "DELAYED",
]);

// ---------- core / auth ----------
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("DESIGNER"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 客戶清單 ----------
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  source: varchar("source", { length: 100 }), // 來源: 官網表單 / 轉介 / 廣告...
  notes: text("notes"),
  ownerUserId: uuid("owner_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 案件（中樞）----------
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  address: text("address"),
  status: projectStatusEnum("status").notNull().default("INQUIRY"),
  designerId: uuid("designer_id").references(() => users.id),
  siteManagerId: uuid("site_manager_id").references(() => users.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  budgetAmount: numeric("budget_amount", { precision: 14, scale: 2 }),
  contractAmount: numeric("contract_amount", { precision: 14, scale: 2 }),
  taxIncluded: boolean("tax_included").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- 廠商清冊 / 工種 ----------
export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(), // 水電/泥作/木作...
});

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  tradeId: uuid("trade_id").references(() => trades.id),
  contactName: varchar("contact_name", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 材料資料庫 ----------
export const materials = pgTable("materials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
  unit: varchar("unit", { length: 30 }),
  imageUrl: text("image_url"),
  location: varchar("location", { length: 100 }), // 放置櫃位
  status: varchar("status", { length: 30 }).default("ACTIVE"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 設計管理 ----------
export const designStages = pgTable("design_stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // 丈量/平面配置/3D/施工圖...
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  clientConfirmedAt: timestamp("client_confirmed_at"), // 業主確認紀錄
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ---------- 價值工程（報價）----------
export const quoteVersions = pgTable("quote_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull().default("版本 1"),
  costMultiplier: numeric("cost_multiplier", { precision: 6, scale: 3 })
    .notNull()
    .default("1.2"), // 成本倍率：業主單價 = 成本單價 × 倍率（未手動調整時）
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const quoteItems = pgTable("quote_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id")
    .notNull()
    .references(() => quoteVersions.id, { onDelete: "cascade" }),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  tradeId: uuid("trade_id").references(() => trades.id), // 工種分類（假設工程/拆除工程...）
  materialId: uuid("material_id").references(() => materials.id),
  itemName: varchar("item_name", { length: 200 }).notNull(),
  unit: varchar("unit", { length: 30 }),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).default("0"),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0"), // 成本單價
  ownerUnitPrice: numeric("owner_unit_price", { precision: 12, scale: 2 }), // null = 自動用成本倍率換算；有值 = 已手動調整
  notes: varchar("notes", { length: 300 }),
  colorTag: varchar("color_tag", { length: 20 }),
  sortOrder: integer("sort_order").notNull().default(0),
});

// 估價版本內的追加減項目（跟工程管理的追加減是不同東西：這裡是報價階段的調整）
export const quoteChangeOrders = pgTable("quote_change_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionId: uuid("version_id")
    .notNull()
    .references(() => quoteVersions.id, { onDelete: "cascade" }),
  itemName: varchar("item_name", { length: 200 }).notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).default("1"),
  unit: varchar("unit", { length: 30 }),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).default("0"), // 成本單價，減項用負數
  ownerUnitPrice: numeric("owner_unit_price", { precision: 12, scale: 2 }),
  notes: varchar("notes", { length: 300 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 合約工程 ----------
export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 30 }).notNull(), // DESIGN / CONSTRUCTION
  amount: numeric("amount", { precision: 14, scale: 2 }),
  signedDate: date("signed_date"),
  language: varchar("language", { length: 10 }).default("zh"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 工程管理 ----------
export const constructionTasks = pgTable("construction_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  tradeId: uuid("trade_id").references(() => trades.id),
  vendorId: uuid("vendor_id").references(() => vendors.id),
  name: varchar("name", { length: 200 }).notNull(),
  plannedStart: date("planned_start"),
  plannedEnd: date("planned_end"),
  actualStart: date("actual_start"),
  actualEnd: date("actual_end"),
  progressPct: integer("progress_pct").notNull().default(0),
  status: taskStatusEnum("status").notNull().default("NOT_STARTED"),
  dependsOnId: uuid("depends_on_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentSchedules = pgTable("payment_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // 簽約款/開工款/期中款/完工款
  sequence: integer("sequence").notNull().default(1),
  percentage: numeric("percentage", { precision: 5, scale: 2 }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  status: paymentStatusEnum("status").notNull().default("PENDING"),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  tradeId: uuid("trade_id").references(() => trades.id),
  vendorId: uuid("vendor_id").references(() => vendors.id),
  description: varchar("description", { length: 200 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  expenseDate: date("expense_date"),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("PENDING"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const changeOrders = pgTable("change_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 200 }).notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(), // 正=追加 負=減項
  status: changeOrderStatusEnum("status").notNull().default("PROPOSED"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteLogs = pgTable("site_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  content: text("content"),
  photoUrls: jsonb("photo_urls").$type<string[]>().default(sql`'[]'::jsonb`),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 人事表單 ----------
export const hrDocuments = pgTable("hr_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeName: varchar("employee_name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // RESIGNATION/NDA/HANDOVER
  issuedDate: date("issued_date"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- relations ----------
export const projectsRelations = relations(projects, ({ one, many }) => ({
  customer: one(customers, {
    fields: [projects.customerId],
    references: [customers.id],
  }),
  designer: one(users, {
    fields: [projects.designerId],
    references: [users.id],
  }),
  siteManager: one(users, {
    fields: [projects.siteManagerId],
    references: [users.id],
  }),
  tasks: many(constructionTasks),
  paymentSchedules: many(paymentSchedules),
  expenses: many(expenses),
  changeOrders: many(changeOrders),
  designStages: many(designStages),
  quoteItems: many(quoteItems),
  contracts: many(contracts),
  siteLogs: many(siteLogs),
}));

export const constructionTasksRelations = relations(
  constructionTasks,
  ({ one }) => ({
    project: one(projects, {
      fields: [constructionTasks.projectId],
      references: [projects.id],
    }),
    trade: one(trades, {
      fields: [constructionTasks.tradeId],
      references: [trades.id],
    }),
    vendor: one(vendors, {
      fields: [constructionTasks.vendorId],
      references: [vendors.id],
    }),
  }),
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
  trade: one(trades, { fields: [expenses.tradeId], references: [trades.id] }),
  vendor: one(vendors, {
    fields: [expenses.vendorId],
    references: [vendors.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one }) => ({
  trade: one(trades, { fields: [vendors.tradeId], references: [trades.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  projects: many(projects),
}));
