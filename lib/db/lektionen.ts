// lib/db/lektionen.ts
import { createClient } from "@/lib/supabase/server";
import type { Lektion, Material, QuizQuestion, Badge } from "@/types";

export async function getLektionenByArea(areaId: string): Promise<Lektion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lektionen")
    .select("*")
    .eq("area_id", areaId)
    .eq("status", "published")
    .order("title");
  return data ?? [];
}

export async function getLektionById(id: string): Promise<Lektion | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lektionen")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getMaterialsByLektion(
  lektionId: string,
): Promise<Material[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materials")
    .select("*")
    .eq("lektion_id", lektionId)
    .order("order");
  return data ?? [];
}

export async function getQuizQuestions(
  lektionId: string,
): Promise<QuizQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("lektion_id", lektionId)
    .order("order");
  return data ?? [];
}

export async function getLektionenByAreaIds(
  areaIds: string[],
): Promise<Lektion[]> {
  if (!areaIds.length) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("lektionen")
    .select("*")
    .in("area_id", areaIds)
    .eq("status", "published")
    .order("title");
  return data ?? [];
}

export async function getBadgeByLektion(
  lektionId: string,
): Promise<Badge | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("badges")
    .select("*")
    .eq("lektion_id", lektionId)
    .single();
  return data;
}
