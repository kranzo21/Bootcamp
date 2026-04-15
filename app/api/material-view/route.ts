// app/api/material-view/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { materialId, lektionId } = await request.json();
  if (!materialId || !lektionId) {
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });
  }

  await supabase.from("material_views").upsert({
    user_id: user.id,
    material_id: materialId,
    viewed_at: new Date().toISOString(),
  });

  // Prüfen ob alle Materialien gesehen
  const { data: allMaterials } = await supabase
    .from("materials")
    .select("id")
    .eq("lektion_id", lektionId);

  const { data: views } = await supabase
    .from("material_views")
    .select("material_id")
    .eq("user_id", user.id)
    .in(
      "material_id",
      (allMaterials ?? []).map((m: any) => m.id),
    );

  if (allMaterials && views && views.length >= allMaterials.length) {
    await supabase.from("lektion_progress").upsert(
      {
        user_id: user.id,
        lektion_id: lektionId,
        materials_completed: true,
      },
      { onConflict: "user_id,lektion_id", ignoreDuplicates: false },
    );
  }

  return NextResponse.json({ ok: true });
}
