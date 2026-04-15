// app/(app)/lektion/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getLektionById,
  getMaterialsByLektion,
  getQuizQuestions,
  getBadgeByLektion,
} from "@/lib/db/lektionen";
import { getLastQuizAttempt } from "@/lib/db/progress";
import LektionClient from "./LektionClient";
import { notFound } from "next/navigation";

export default async function LektionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [lektion, materials, questions, badge, lastAttempt] = await Promise.all(
    [
      getLektionById(id),
      getMaterialsByLektion(id),
      getQuizQuestions(id),
      getBadgeByLektion(id),
      getLastQuizAttempt(user!.id, id),
    ],
  );

  if (!lektion) notFound();

  // Bereits gesehene Materialien laden
  const { data: viewedRows } = await supabase
    .from("material_views")
    .select("material_id")
    .eq("user_id", user!.id);
  const viewedIds = new Set((viewedRows ?? []).map((v: any) => v.material_id));

  // Fortschritt laden
  const { data: progressRow } = await supabase
    .from("lektion_progress")
    .select("materials_completed, passed")
    .eq("user_id", user!.id)
    .eq("lektion_id", id)
    .single();

  // 24h Sperre prüfen
  let lockedUntil: string | null = null;
  if (lastAttempt && !lastAttempt.passed) {
    const attemptTime = new Date(lastAttempt.attempted_at).getTime();
    const unlockTime = attemptTime + 24 * 60 * 60 * 1000;
    if (Date.now() < unlockTime) {
      lockedUntil = new Date(unlockTime).toISOString();
    }
  }

  return (
    <LektionClient
      lektion={lektion}
      materials={materials}
      questions={questions}
      badge={badge}
      viewedMaterialIds={Array.from(viewedIds)}
      materialsCompleted={progressRow?.materials_completed ?? false}
      passed={progressRow?.passed ?? false}
      lockedUntil={lockedUntil}
    />
  );
}
