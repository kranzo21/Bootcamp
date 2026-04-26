import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lektionId } = await req.json();
  if (!lektionId)
    return NextResponse.json({ error: "Missing lektionId" }, { status: 400 });

  const { error } = await supabase.from("lektion_progress").upsert(
    {
      user_id: user.id,
      lektion_id: lektionId,
      passed: true,
      materials_completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lektion_id" },
  );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
