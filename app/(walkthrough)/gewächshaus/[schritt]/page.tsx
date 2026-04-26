import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getCachedGewächshausWalkthrough } from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";
import WalkthroughClient from "./WalkthroughClient";

export default async function WalkthroughSchrittPage({
  params,
}: {
  params: Promise<{ schritt: string }>;
}) {
  const { schritt: schrittStr } = await params;
  const schritt = parseInt(schrittStr, 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ lektionen, modules }, progress] = await Promise.all([
    getCachedGewächshausWalkthrough(),
    getLektionProgress(user!.id),
  ]);

  if (
    !lektionen.length ||
    isNaN(schritt) ||
    schritt < 1 ||
    schritt > lektionen.length
  )
    notFound();

  const lektion = lektionen[schritt - 1];
  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  // Vorherige Lektion muss abgeschlossen sein
  if (schritt > 1 && !passedIds.has(lektionen[schritt - 2].id)) {
    redirect("/gewächshaus");
  }

  const modul = modules.find((m) => m.id === lektion.module_id);
  const isLast = schritt === lektionen.length;
  const nextHref = isLast
    ? "/gewächshaus/pruefung"
    : `/gewächshaus/${schritt + 1}`;

  return (
    <WalkthroughClient
      lektion={lektion}
      moduleName={modul?.name ?? ""}
      schritt={schritt}
      totalSchritte={lektionen.length}
      nextHref={nextHref}
      alreadyCompleted={passedIds.has(lektion.id)}
    />
  );
}
