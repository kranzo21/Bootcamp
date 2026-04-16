// app/api/admin/quiz-list/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lektionId = request.nextUrl.searchParams.get("lektionId");
  if (!lektionId) return NextResponse.json([]);
  const db = createAdminClient();
  const { data } = await db
    .from("quiz_questions")
    .select("*")
    .eq("lektion_id", lektionId)
    .order("order");
  return NextResponse.json(data ?? []);
}
