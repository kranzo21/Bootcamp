// lib/db/progress.ts
import { createClient } from "@/lib/supabase/server";
import type {
  LektionProgress,
  UserBadge,
  UserQualification,
  UserProgram,
} from "@/types";

export async function getUserPrograms(userId: string): Promise<UserProgram[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_programs")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getLektionProgress(
  userId: string,
): Promise<LektionProgress[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lektion_progress")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getUserQualifications(
  userId: string,
): Promise<UserQualification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_qualifications")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getLastQuizAttempt(userId: string, lektionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("passed, attempted_at")
    .eq("user_id", userId)
    .eq("lektion_id", lektionId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}
