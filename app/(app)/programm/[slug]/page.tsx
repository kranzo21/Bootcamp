// app/(app)/programm/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getProgramBySlug,
  getAreaBySlug,
  getTutorialsByProgram,
  getRessourcenByProgram,
} from "@/lib/db/programs";
import { getLektionenByArea } from "@/lib/db/lektionen";
import { getLektionProgress } from "@/lib/db/progress";
import TutorialsTab from "@/components/worship/TutorialsTab";
import RessourcenTab from "@/components/worship/RessourcenTab";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = "gewaechshaus" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const [tutorials, ressourcen, lektionProgress] = await Promise.all([
    getTutorialsByProgram(program.id),
    getRessourcenByProgram(program.id),
    getLektionProgress(user!.id),
  ]);

  // Gewächshaus-Bereich laden
  const gewaechshausArea = await getAreaBySlug("gewaechshaus");
  const lektionen = gewaechshausArea
    ? await getLektionenByArea(gewaechshausArea.id)
    : [];
  const passedIds = new Set(
    lektionProgress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">
        {program.name}
      </h1>
      <p className="text-sm text-gray-mid mb-6">{program.description}</p>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {/* Gewächshaus Tab — mit Fortschritt */}
        <Link
          href={`/programm/${slug}?tab=gewaechshaus`}
          className={`flex-1 border rounded-xl p-4 transition hover:shadow-sm ${
            tab === "gewaechshaus"
              ? "border-teal bg-teal/5"
              : "border-border bg-white"
          }`}
        >
          <p
            className={`font-semibold text-sm mb-2 ${tab === "gewaechshaus" ? "text-teal" : "text-ink"}`}
          >
            Gewächshaus
          </p>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className="bg-teal h-1.5 rounded-full transition-all"
              style={{
                width:
                  lektionen.length > 0
                    ? `${Math.round(
                        (Array.from(passedIds).filter((id) =>
                          lektionen.some((l) => l.id === id),
                        ).length /
                          lektionen.length) *
                          100,
                      )}%`
                    : "0%",
              }}
            />
          </div>
          <p className="text-[10px] text-gray-mid mt-1">
            {
              Array.from(passedIds).filter((id) =>
                lektionen.some((l) => l.id === id),
              ).length
            }{" "}
            / {lektionen.length} abgeschlossen
          </p>
        </Link>

        {/* Tutorials Tab */}
        <Link
          href={`/programm/${slug}?tab=tutorials`}
          className={`flex-1 border rounded-xl p-4 transition hover:shadow-sm flex items-center justify-center ${
            tab === "tutorials"
              ? "border-teal bg-teal/5"
              : "border-border bg-white"
          }`}
        >
          <p
            className={`font-semibold text-sm ${tab === "tutorials" ? "text-teal" : "text-ink"}`}
          >
            Tutorials
          </p>
        </Link>

        {/* Ressourcen Tab */}
        <Link
          href={`/programm/${slug}?tab=ressourcen`}
          className={`flex-1 border rounded-xl p-4 transition hover:shadow-sm flex items-center justify-center ${
            tab === "ressourcen"
              ? "border-teal bg-teal/5"
              : "border-border bg-white"
          }`}
        >
          <p
            className={`font-semibold text-sm ${tab === "ressourcen" ? "text-teal" : "text-ink"}`}
          >
            Ressourcen
          </p>
        </Link>
      </div>

      {/* GEWÄCHSHAUS */}
      {tab === "gewaechshaus" && (
        <div className="flex flex-col gap-3">
          {lektionen.length === 0 && (
            <p className="text-sm text-gray-mid">
              Noch keine Lektionen vorhanden.
            </p>
          )}
          {lektionen.map((l) => (
            <Link
              key={l.id}
              href={`/lektion/${l.id}`}
              className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold text-ink">{l.title}</h3>
                {l.description && (
                  <p className="text-sm text-gray-mid">{l.description}</p>
                )}
              </div>
              {passedIds.has(l.id) && (
                <span className="text-teal text-xl">✓</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* TUTORIALS */}
      {tab === "tutorials" && <TutorialsTab tutorials={tutorials} />}

      {/* RESSOURCEN */}
      {tab === "ressourcen" && <RessourcenTab ressourcen={ressourcen} />}
    </div>
  );
}
