import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const areaId = searchParams.get("areaId");
  if (!areaId) return NextResponse.json([]);

  const db = createAdminClient();
  const { data } = await db
    .from("modules")
    .select("id, name")
    .eq("area_id", areaId)
    .order("order");

  return NextResponse.json(data ?? []);
}
