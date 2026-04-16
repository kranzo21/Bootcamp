// app/api/user-instruments/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { instruments } = await request.json();
  if (!Array.isArray(instruments))
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });

  const { error } = await supabase
    .from("users")
    .update({ instruments })
    .eq("id", user.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
