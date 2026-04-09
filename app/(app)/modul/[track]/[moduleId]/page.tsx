import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getModule, getModules, getMaterialIds } from "@/lib/content/loader";
import ModuleClient from "./ModuleClient";
import type { Path, Track } from "@/types";

interface Props {
  params: Promise<{ track: string; moduleId: string }>;
}

export default async function ModulePage({ params }: Props) {
  const { track, moduleId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("path")
    .eq("id", user.id)
    .single();

  const path = (profile?.path ?? "instrumentalist") as Path;
  const trackTyped = track as Track;

  const module = getModule(path, trackTyped, moduleId);
  if (!module) notFound();

  // Sequential access: previous module must be passed
  const modules = getModules(path, trackTyped);
  const moduleIndex = modules.findIndex((m) => m.id === moduleId);
  if (moduleIndex > 0) {
    const prevModule = modules[moduleIndex - 1];
    const { data: prevProgress } = await supabase
      .from("progress")
      .select("passed")
      .eq("user_id", user.id)
      .eq("module_id", prevModule.id)
      .eq("track", track)
      .single();
    if (!prevProgress?.passed) redirect("/dashboard");
  }

  // Load viewed materials
  const { data: viewedRows } = await supabase
    .from("material_views")
    .select("material_id")
    .eq("user_id", user.id)
    .eq("module_id", moduleId);

  const viewedIds = (viewedRows ?? []).map(
    (r: { material_id: string }) => r.material_id,
  );
  const allMaterialIds = getMaterialIds(module);
  const materialsCompleted = allMaterialIds.every((id) =>
    viewedIds.includes(id),
  );

  // Load current progress
  const { data: progressRow } = await supabase
    .from("progress")
    .select("materials_completed, passed")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .eq("track", track)
    .single();

  // Load last quiz attempt for cooldown
  const { data: lastAttempt } = await supabase
    .from("quiz_attempts")
    .select("attempted_at, passed")
    .eq("user_id", user.id)
    .eq("module_id", moduleId)
    .order("attempted_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <ModuleClient
      module={module}
      track={trackTyped}
      userId={user.id}
      viewedIds={viewedIds}
      materialsCompleted={
        materialsCompleted || progressRow?.materials_completed || false
      }
      alreadyPassed={progressRow?.passed ?? false}
      lastAttemptAt={lastAttempt?.attempted_at ?? null}
    />
  );
}
