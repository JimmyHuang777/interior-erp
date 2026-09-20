import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(1),
  tradeId: z.string().uuid().nullable().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  amount: z.number(),
  expenseDate: z.string().nullable().optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
});

export const POST = apiRoute(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .insert(expenses)
    .values({
      projectId: id,
      description: body.description,
      tradeId: body.tradeId || null,
      vendorId: body.vendorId || null,
      amount: String(body.amount),
      expenseDate: body.expenseDate || null,
      paymentStatus: body.paymentStatus ?? "PENDING",
    })
    .returning();

  await logAction(user.id, "CREATE", "expense", row.id, { projectId: id });

  return NextResponse.json(row);
});
