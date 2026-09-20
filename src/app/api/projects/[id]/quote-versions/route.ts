import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { quoteVersions } from "@/db/schema";
import { requireUser } from "@/lib/authz";
import { apiRoute } from "@/lib/api";
import { logAction } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  costMultiplier: z.number().positive().optional(),
});

export const POST = apiRoute(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  const { id } = await params;
  const body = schema.parse(await req.json().catch(() => ({})));

  const existing = await db
    .select()
    .from(quoteVersions)
    .where(eq(quoteVersions.projectId, id));

  const [row] = await db
    .insert(quoteVersions)
    .values({
      projectId: id,
      name: body.name || `版本 ${existing.length + 1}`,
      costMultiplier: body.costMultiplier != null ? String(body.costMultiplier) : "1.2",
      sortOrder: existing.length,
    })
    .returning();

  await logAction(user.id, "CREATE", "quote_version", row.id, { projectId: id });
  return NextResponse.json(row);
});
