import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trades } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export const POST = apiRoute(async function POST(req: NextRequest) {
  const user = await requireUser();
  const { name } = schema.parse(await req.json());

  const [existing] = await db.select().from(trades).where(eq(trades.name, name)).limit(1);
  if (existing) return NextResponse.json(existing);

  const [row] = await db.insert(trades).values({ name }).returning();
  await logAction(user.id, "CREATE", "trade", row.id, { name });
  return NextResponse.json(row);
});
