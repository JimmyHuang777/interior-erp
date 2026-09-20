import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { changeOrders } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(1),
  amount: z.number(), // positive = 追加, negative = 減項
  status: z.enum(["PROPOSED", "APPROVED", "REJECTED"]).optional(),
});

export const POST = apiRoute(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = schema.parse(await req.json());

  const [row] = await db
    .insert(changeOrders)
    .values({
      projectId: id,
      description: body.description,
      amount: String(body.amount),
      status: body.status ?? "PROPOSED",
    })
    .returning();

  await logAction(user.id, "CREATE", "change_order", row.id, { projectId: id });

  return NextResponse.json(row);
});
