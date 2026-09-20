import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "資料格式錯誤" }, { status: 400 });
  }
  const { name, phone, email, address, message } = parsed.data;

  await db.insert(customers).values({
    name,
    phone,
    email: email || null,
    address: address || null,
    source: "官網表單",
    notes: message || null,
  });

  return NextResponse.json({ ok: true });
}
