// app/(app)/bereich/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getCachedAreaBySlug,
  getCachedProgramById,
  getCachedLektionenByArea,
  getCachedModulesByArea,
  getCachedGewächshausWalkthrough,
} from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";
import Link from "next/link";
import { notFound } from "next/navigation";
import LektionenTab from "@/components/worship/LektionenTab";

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const area = await getCachedAreaBySlug(slug);
  if (!area) notFound();

  const isGewächshaus = slug === "gewaechshaus";

  const [lektionen, progress, program, profileResult, modules] =
    await Promise.all([
      getCachedLektionenByArea(area.id),
      getLektionProgress(user!.id),
      getCachedProgramById(area.program_id),
      supabase.from("users").select("is_admin").eq("id", user!.id).single(),
      getCachedModulesByArea(area.id),
    ]);

  const passedIds = progress.filter((p) => p.passed).map((p) => p.lektion_id);
  const passedSet = new Set(passedIds);
  const isAdmin = profileResult.data?.is_admin ?? false;

  let walkthroughButton = null;
  if (isGewächshaus) {
    const { lektionen: ordered } = await getCachedGewächshausWalkthrough();
    const completedCount = ordered.filter((l) => passedSet.has(l.id)).length;
    const total = ordered.length;
    const allDone = total > 0 && completedCount === total;
    const firstIncomplete = ordered.findIndex((l) => !passedSet.has(l.id));
    const nextSchritt = firstIncomplete + 1;

    walkthroughButton = (
      <Link
        href={
          allDone
            ? "/gewaechshaus/pruefung"
            : completedCount === 0
              ? "/gewaechshaus/1"
              : `/gewaechshaus/${nextSchritt}`
        }
        className="w-full flex items-center justify-between bg-teal text-white px-5 py-4 rounded-2xl mb-8 hover:bg-teal/90 transition-colors"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[2px] opacity-70 mb-0.5">
            Gewächshaus
          </p>
          <p className="font-bold text-sm">
            {allDone
              ? "Zur Abschlussprüfung →"
              : completedCount === 0
                ? "Starten →"
                : "Weitermachen →"}
          </p>
        </div>
        <span className="text-xs opacity-70">
          {completedCount}/{total}
          {allDone ? " ✓" : ""}
        </span>
      </Link>
    );
  }

  return (
    <div>
      <Link
        href={`/programm/${program?.slug ?? ""}`}
        className="text-sm text-teal hover:underline mb-4 block"
      >
        ← {program?.name ?? "Zurück"}
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {area.name}
        </h1>
        {isAdmin && (
          <Link
            href={`/admin/inhalte/${slug}/lektionen`}
            title="Bereich bearbeiten"
            className="text-gray-mid hover:text-teal transition-colors"
          >
            ✏️
          </Link>
        )}
      </div>

      {walkthroughButton}

      {!isGewächshaus && (
        <LektionenTab
          lektionen={lektionen}
          modules={modules}
          passedIds={passedIds}
          isAdmin={isAdmin}
          areaId={area.id}
        />
      )}
    </div>
  );
}
