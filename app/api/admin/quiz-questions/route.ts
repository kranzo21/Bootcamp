// app/api/admin/quiz-questions/route.ts
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

  const { lektionId, question, options, correctIndex, order } =
    await request.json();
  const db = createAdminClient();
  const { data, error } = await db
    .from("quiz_questions")
    .insert({
      lektion_id: lektionId,
      question,
      options,
      correct_index: correctIndex,
      order,
    })
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, question, options, correctIndex } = await request.json();
  const db = createAdminClient();
  const { data, error } = await db
    .from("quiz_questions")
    .update({ question, options, correct_index: correctIndex })
    .eq("id", id)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const admin = await assertAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  const db = createAdminClient();
  const { error } = await db.from("quiz_questions").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
