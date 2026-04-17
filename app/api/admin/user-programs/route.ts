// app/api/admin/user-programs/route.ts
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
  const { userId, programId } = await request.json();
  const db = createAdminClient();
  const { error } = await db
    .from("user_programs")
    .insert({ user_id: userId, program_id: programId });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await assertAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId, programId } = await request.json();
  const db = createAdminClient();
  await db
    .from("user_programs")
    .delete()
    .eq("user_id", userId)
    .eq("program_id", programId);
  return NextResponse.json({ ok: true });
}
