// app/(app)/programm/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getProgramBySlug,
  getRegularAreasByProgram,
  getInstrumentAreasByProgram,
} from "@/lib/db/programs";
import { getLektionenByAreaIds } from "@/lib/db/lektionen";
import {
  getLektionProgress,
  getUserFavouriteTutorials,
  getUserFavouriteRessourcen,
} from "@/lib/db/progress";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Area, Tutorial, Ressource } from "@/types";

export default async function ProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = "allgemein" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const [regularAreas, instrumentAreas, lektionProgress] = await Promise.all([
    getRegularAreasByProgram(program.id),
    getInstrumentAreasByProgram(program.id),
    getLektionProgress(user!.id),
  ]);

  const passedIds = new Set(
    lektionProgress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  let lektionenByArea: Record<string, { id: string; area_id: string }[]> = {};
  let totalLektionen = 0;
  let totalPassed = 0;
  let favTutorials: Tutorial[] = [];
  let favRessourcen: Ressource[] = [];
  let userInstruments: string[] = [];

  if (tab === "allgemein") {
    const areaIds = regularAreas.map((a) => a.id);
    const allLektionen = await getLektionenByAreaIds(areaIds);
    for (const area of regularAreas) {
      lektionenByArea[area.id] = allLektionen.filter(
        (l) => l.area_id === area.id,
      );
    }
    totalLektionen = allLektionen.length;
    totalPassed = allLektionen.filter((l) => passedIds.has(l.id)).length;
  } else {
    const [tutorials, ressourcen, profile] = await Promise.all([
      getUserFavouriteTutorials(user!.id),
      getUserFavouriteRessourcen(user!.id),
      supabase.from("users").select("instruments").eq("id", user!.id).single(),
    ]);
    favTutorials = tutorials as Tutorial[];
    favRessourcen = ressourcen as Ressource[];
    userInstruments = (profile.data?.instruments as string[]) ?? [];
  }

  const totalPct =
    totalLektionen > 0 ? Math.round((totalPassed / totalLektionen) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">
        {program.name}
      </h1>
      <p className="text-sm text-gray-mid mb-6">{program.description}</p>

      {/* Tab-Leiste — abgerundete Karten */}
      <div className="flex gap-3 mb-6">
        {/* Allgemein — mit Gesamtfortschritt */}
        <Link
          href={`/programm/${slug}?tab=allgemein`}
          className={`flex-1 border rounded-xl p-4 transition hover:shadow-sm ${
            tab === "allgemein"
              ? "border-teal bg-teal/5"
              : "border-border bg-white"
          }`}
        >
          <p
            className={`font-semibold text-sm mb-2 ${tab === "allgemein" ? "text-teal" : "text-ink"}`}
          >
            Allgemein
          </p>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className="bg-teal h-1.5 rounded-full transition-all"
              style={{ width: `${totalPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-mid mt-1">
            {totalPassed} / {totalLektionen} abgeschlossen
          </p>
        </Link>

        {/* Mein Bereich */}
        <Link
          href={`/programm/${slug}?tab=mein-bereich`}
          className={`flex-1 border rounded-xl p-4 transition hover:shadow-sm flex items-center justify-center ${
            tab === "mein-bereich"
              ? "border-teal bg-teal/5"
              : "border-border bg-white"
          }`}
        >
          <p
            className={`font-semibold text-sm ${tab === "mein-bereich" ? "text-teal" : "text-ink"}`}
          >
            Mein Bereich
          </p>
        </Link>
      </div>

      {/* ─── ALLGEMEIN ─── */}
      {tab === "allgemein" && (
        <div className="flex flex-col gap-8">
          {regularAreas.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-mid mb-3">
                Lernbereiche
              </h2>
              <div className="flex flex-col gap-3">
                {regularAreas.map((area: Area) => {
                  const lektionen = lektionenByArea[area.id] ?? [];
                  const passed = lektionen.filter((l) =>
                    passedIds.has(l.id),
                  ).length;
                  const pct =
                    lektionen.length > 0
                      ? Math.round((passed / lektionen.length) * 100)
                      : 0;
                  return (
                    <Link
                      key={area.id}
                      href={`/bereich/${area.slug}`}
                      className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-ink">{area.name}</p>
                        <span className="text-xs text-gray-mid">
                          {passed} / {lektionen.length}
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1.5">
                        <div
                          className="bg-teal h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {area.description && (
                        <p className="text-xs text-gray-mid mt-2">
                          {area.description}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {instrumentAreas.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-mid mb-3">
                Instrumente
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {instrumentAreas.map((area: Area) => (
                  <Link
                    key={area.id}
                    href={`/instrument/${area.slug}`}
                    className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow text-center"
                  >
                    <p className="font-semibold text-ink">{area.name}</p>
                    {area.description && (
                      <p className="text-xs text-gray-mid mt-1">
                        {area.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ─── MEIN BEREICH ─── */}
      {tab === "mein-bereich" && (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-mid mb-3">
              Favorisierte Tutorials
            </h2>
            {favTutorials.length === 0 ? (
              <p className="text-sm text-gray-mid">
                Noch keine Tutorials favorisiert.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {favTutorials.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tutorial/${t.id}`}
                    className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-ink">{t.title}</p>
                      {t.description && (
                        <p className="text-xs text-gray-mid">{t.description}</p>
                      )}
                    </div>
                    <span className="text-yellow-400 ml-3">★</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-mid mb-3">
              Favorisierte Ressourcen
            </h2>
            {favRessourcen.length === 0 ? (
              <p className="text-sm text-gray-mid">
                Noch keine Ressourcen favorisiert.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {favRessourcen.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow flex items-center gap-3"
                  >
                    <span className="text-xl">
                      {r.type === "pdf" ? "📄" : "🔗"}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-gray-mid">{r.description}</p>
                      )}
                    </div>
                    <span className="text-yellow-400">★</span>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-mid">
                Meine Instrumente
              </h2>
              <Link
                href="/einstellungen"
                className="text-xs text-teal hover:underline"
              >
                Bearbeiten →
              </Link>
            </div>
            {userInstruments.length === 0 ? (
              <p className="text-sm text-gray-mid">
                Noch keine Instrumente ausgewählt.{" "}
                <Link
                  href="/einstellungen"
                  className="text-teal hover:underline"
                >
                  Jetzt festlegen
                </Link>
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userInstruments.map((inst) => (
                  <span
                    key={inst}
                    className="px-3 py-1 bg-teal/10 text-teal rounded-full text-sm font-medium capitalize"
                  >
                    {inst}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
