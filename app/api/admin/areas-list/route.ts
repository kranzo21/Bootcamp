// app/api/admin/areas-list/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const db = createAdminClient();
  const { data } = await db.from("areas").select("id, name").order("name");
  return NextResponse.json(data ?? []);
}
