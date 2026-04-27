import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCachedGewächshausWalkthrough } from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";

export default async function GewächshausPage() {
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

  const firstIncomplete = lektionen.findIndex((l) => !passedIds.has(l.id));

  if (firstIncomplete === -1) redirect("/gewaechshaus/pruefung");
  redirect(`/gewaechshaus/${firstIncomplete + 1}`);
}
