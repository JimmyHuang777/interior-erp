import { db } from "./index";
import { users, trades, customers, projects } from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const [admin] = await db
    .insert(users)
    .values([
      {
        name: "系統管理者",
        email: "admin@example.com",
        passwordHash,
        role: "ADMIN",
      },
      {
        name: "設計師 - 陳design",
        email: "designer@example.com",
        passwordHash,
        role: "DESIGNER",
      },
      {
        name: "工務 - 林工程",
        email: "site@example.com",
        passwordHash,
        role: "SITE",
      },
      {
        name: "行政 - 王行政",
        email: "hr@example.com",
        passwordHash,
        role: "HR",
      },
    ])
    .returning();

  const tradeNames = [
    "拆除",
    "水電",
    "泥作",
    "木作",
    "油漆",
    "系統櫃",
    "鋁窗",
    "石材",
    "空調",
    "清潔",
  ];
  const insertedTrades = await db
    .insert(trades)
    .values(tradeNames.map((name) => ({ name })))
    .returning();

  const [customer] = await db
    .insert(customers)
    .values({
      name: "張先生",
      phone: "0912-345-678",
      email: "client@example.com",
      address: "台北市大安區",
      source: "官網表單",
      ownerUserId: admin.id,
    })
    .returning();

  const [project] = await db
    .insert(projects)
    .values({
      name: "張先生 - 大安區住宅新裝修",
      customerId: customer.id,
      address: "台北市大安區復興南路一段",
      status: "CONSTRUCTION",
      designerId: admin.id,
      siteManagerId: admin.id,
      startDate: "2026-08-01",
      endDate: "2026-11-30",
      budgetAmount: "1800000",
      contractAmount: "1850000",
      taxIncluded: false,
    })
    .returning();

  console.log("Seed complete:");
  console.log({ admin: admin.email, trades: insertedTrades.length, project: project.name });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
