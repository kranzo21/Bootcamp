// app/api/admin/content/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  return data?.is_admin ? user : null;
}

export async function POST(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, data } = await request.json();
  const allowed = [
    "programs",
    "areas",
    "tutorials",
    "lektionen",
    "materials",
    "quiz_questions",
    "ressourcen",
    "badges",
    "qualifications",
    "qualification_badges",
  ];
  if (!allowed.includes(table))
    return NextResponse.json({ error: "Ungültige Tabelle" }, { status: 400 });

  const db = createAdminClient();
  const { data: result, error } = await db
    .from(table)
    .insert(data)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, id, data } = await request.json();
  const allowed = [
    "programs",
    "areas",
    "tutorials",
    "lektionen",
    "materials",
    "quiz_questions",
    "ressourcen",
    "badges",
    "qualifications",
  ];
  if (!allowed.includes(table))
    return NextResponse.json({ error: "Ungültige Tabelle" }, { status: 400 });

  const db = createAdminClient();
  const { data: result, error } = await db
    .from(table)
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { table, id } = await request.json();
  const allowed = [
    "programs",
    "areas",
    "tutorials",
    "lektionen",
    "materials",
    "quiz_questions",
    "ressourcen",
    "badges",
    "qualifications",
    "qualification_badges",
  ];
  if (!allowed.includes(table))
    return NextResponse.json({ error: "Ungültige Tabelle" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from(table).delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
