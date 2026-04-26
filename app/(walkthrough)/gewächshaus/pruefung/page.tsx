import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCachedGewächshausWalkthrough } from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";
import PruefungClient from "./PruefungClient";

export default async function PruefungPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ lektionen }, progress] = await Promise.all([
    getCachedGewächshausWalkthrough(),
    getLektionProgress(user!.id),
  ]);

  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  const allDone =
    lektionen.length > 0 && lektionen.every((l) => passedIds.has(l.id));
  if (!allDone) redirect("/gewächshaus");

  return <PruefungClient />;
}
