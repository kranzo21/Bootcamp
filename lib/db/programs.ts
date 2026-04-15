// lib/db/programs.ts
import { createClient } from "@/lib/supabase/server";
import type { Program, Area, Tutorial, Ressource } from "@/types";

export async function getPrograms(): Promise<Program[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select("*").order("order");
  return data ?? [];
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getAreasByProgram(programId: string): Promise<Area[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("areas")
    .select("*")
    .eq("program_id", programId)
    .order("order");
  return data ?? [];
}

export async function getAreaBySlug(slug: string): Promise<Area | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("areas")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getTutorialsByArea(areaId: string): Promise<Tutorial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutorials")
    .select("*")
    .eq("area_id", areaId)
    .order("order");
  return data ?? [];
}

export async function getTutorialById(id: string): Promise<Tutorial | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function getRessourcenByArea(
  areaId: string,
): Promise<Ressource[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ressourcen")
    .select("*")
    .eq("area_id", areaId)
    .order("order");
  return data ?? [];
}
