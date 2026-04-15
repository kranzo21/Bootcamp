// app/api/admin/user-badges/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return data?.is_admin ?? false;
}

export async function POST(request: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, badgeId } = await request.json();
  const db = createAdminClient();
  const { error } = await db.from("user_badges").upsert({
    user_id: userId,
    badge_id: badgeId,
    earned_at: new Date().toISOString(),
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, badgeId } = await request.json();
  const db = createAdminClient();
  await db
    .from("user_badges")
    .delete()
    .eq("user_id", userId)
    .eq("badge_id", badgeId);
  return NextResponse.json({ ok: true });
}
