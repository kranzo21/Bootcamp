// lib/db/cached.ts
// Cached versions of read-only content queries using admin client.
// Revalidates every 60 seconds — fast enough for content updates to appear quickly.
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const TTL = 60; // seconds

export const getCachedPrograms = unstable_cache(
  async () => {
    const db = createAdminClient();
    const { data } = await db.from("programs").select("*").order("order");
    return data ?? [];
  },
  ["programs"],
  { revalidate: TTL, tags: ["programs"] },
);

export const getCachedProgramBySlug = unstable_cache(
  async (slug: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("programs")
      .select("*")
      .eq("slug", slug)
      .single();
    return data ?? null;
  },
  ["program-by-slug"],
  { revalidate: TTL, tags: ["programs"] },
);

export const getCachedAreaBySlug = unstable_cache(
  async (slug: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("areas")
      .select("*")
      .eq("slug", slug)
      .single();
    return data ?? null;
  },
  ["area-by-slug"],
  { revalidate: TTL, tags: ["areas"] },
);

export const getCachedRegularAreasByProgram = unstable_cache(
  async (programId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("areas")
      .select("*")
      .eq("program_id", programId)
      .eq("area_type", "regular")
      .order("order");
    return data ?? [];
  },
  ["regular-areas-by-program"],
  { revalidate: TTL, tags: ["areas"] },
);

export const getCachedInstrumentAreasByProgram = unstable_cache(
  async (programId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("areas")
      .select("*")
      .eq("program_id", programId)
      .eq("area_type", "instrument")
      .order("order");
    return data ?? [];
  },
  ["instrument-areas-by-program"],
  { revalidate: TTL, tags: ["areas"] },
);

export const getCachedLektionenByArea = unstable_cache(
  async (areaId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("lektionen")
      .select("*")
      .eq("area_id", areaId)
      .eq("status", "published")
      .order("order");
    return data ?? [];
  },
  ["lektionen-by-area"],
  { revalidate: TTL, tags: ["lektionen"] },
);

export const getCachedLektionenByAreaIds = unstable_cache(
  async (areaIds: string[]) => {
    if (!areaIds.length) return [];
    const db = createAdminClient();
    const { data } = await db
      .from("lektionen")
      .select("*")
      .in("area_id", areaIds)
      .eq("status", "published")
      .order("order");
    return data ?? [];
  },
  ["lektionen-by-area-ids"],
  { revalidate: TTL, tags: ["lektionen"] },
);

export const getCachedLektionById = unstable_cache(
  async (id: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("lektionen")
      .select("*")
      .eq("id", id)
      .single();
    return data ?? null;
  },
  ["lektion-by-id"],
  { revalidate: TTL, tags: ["lektionen"] },
);

export const getCachedQuizQuestions = unstable_cache(
  async (lektionId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("quiz_questions")
      .select("*")
      .eq("lektion_id", lektionId)
      .order("order");
    return data ?? [];
  },
  ["quiz-by-lektion"],
  { revalidate: TTL, tags: ["quiz_questions"] },
);

export const getCachedBadgeByLektion = unstable_cache(
  async (lektionId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("badges")
      .select("*")
      .eq("lektion_id", lektionId)
      .single();
    return data ?? null;
  },
  ["badge-by-lektion"],
  { revalidate: TTL, tags: ["badges"] },
);

export const getCachedTutorialById = unstable_cache(
  async (id: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("tutorials")
      .select("*")
      .eq("id", id)
      .single();
    return data ?? null;
  },
  ["tutorial-by-id"],
  { revalidate: TTL, tags: ["tutorials"] },
);

export const getCachedTutorialsByArea = unstable_cache(
  async (areaId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("tutorials")
      .select("*")
      .eq("area_id", areaId)
      .order("order");
    return data ?? [];
  },
  ["tutorials-by-area"],
  { revalidate: TTL, tags: ["tutorials"] },
);

export const getCachedRessourcenByArea = unstable_cache(
  async (areaId: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("ressourcen")
      .select("*")
      .eq("area_id", areaId)
      .order("order");
    return data ?? [];
  },
  ["ressourcen-by-area"],
  { revalidate: TTL, tags: ["ressourcen"] },
);

export const getCachedProgramById = unstable_cache(
  async (id: string) => {
    const db = createAdminClient();
    const { data } = await db
      .from("programs")
      .select("*")
      .eq("id", id)
      .single();
    return data ?? null;
  },
  ["program-by-id"],
  { revalidate: TTL, tags: ["programs"] },
);
