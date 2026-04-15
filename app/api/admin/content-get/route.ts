// app/api/admin/content-get/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");
  if (!table || !id)
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });

  const db = createAdminClient();
  const { data, error } = await db
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
