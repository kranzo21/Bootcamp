// app/api/favourites/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemType, itemId } = await request.json();
  if (!itemType || !itemId)
    return NextResponse.json({ error: "Fehlende Parameter" }, { status: 400 });

  await supabase.from("user_favourites").upsert({
    user_id: user.id,
    item_type: itemType,
    item_id: itemId,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemType, itemId } = await request.json();
  await supabase
    .from("user_favourites")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  return NextResponse.json({ ok: true });
}
