// app/(app)/lektion/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getCachedLektionById,
  getCachedQuizQuestions,
  getCachedBadgeByLektion,
} from "@/lib/db/cached";
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

  const [lektion, questions, badge, lastAttempt] = await Promise.all([
    getCachedLektionById(id),
    getCachedQuizQuestions(id),
    getCachedBadgeByLektion(id),
    getLastQuizAttempt(user!.id, id),
  ]);

  if (!lektion) notFound();

  const { data: progressRow } = await supabase
    .from("lektion_progress")
    .select("passed")
    .eq("user_id", user!.id)
    .eq("lektion_id", id)
    .single();

  let lockedUntil: string | null = null;
  if (lastAttempt && !lastAttempt.passed) {
    const unlockTime =
      new Date(lastAttempt.attempted_at).getTime() + 24 * 60 * 60 * 1000;
    if (Date.now() < unlockTime) {
      lockedUntil = new Date(unlockTime).toISOString();
    }
  }

  return (
    <LektionClient
      lektion={lektion}
      questions={questions}
      badge={badge}
      passed={progressRow?.passed ?? false}
      lockedUntil={lockedUntil}
    />
  );
}
