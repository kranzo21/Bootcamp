// app/(app)/programm/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getProgramBySlug,
  getRegularAreasByProgram,
  getInstrumentAreasByProgram,
  getTutorialsByProgram,
  getRessourcenByProgram,
} from "@/lib/db/programs";
import { getLektionenByArea } from "@/lib/db/lektionen";
import { getLektionProgress, getUserFavourites } from "@/lib/db/progress";
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
  const { tab = "allgemein" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const { data: profile } = await supabase
    .from("users")
    .select("instruments")
    .eq("id", user!.id)
    .single();

  const userInstruments: string[] = profile?.instruments ?? [];

  const [regularAreas, instrumentAreas, lektionProgress, favourites] =
    await Promise.all([
      getRegularAreasByProgram(program.id),
      getInstrumentAreasByProgram(program.id),
      getLektionProgress(user!.id),
      getUserFavourites(user!.id),
    ]);

  // Fortschritt pro regulärem Bereich
  const areaProgress: Record<string, { done: number; total: number }> = {};
  for (const area of regularAreas) {
    const lektionen = await getLektionenByArea(area.id);
    const passedIds = new Set(
      lektionProgress.filter((p) => p.passed).map((p) => p.lektion_id),
    );
    areaProgress[area.id] = {
      total: lektionen.length,
      done: lektionen.filter((l) => passedIds.has(l.id)).length,
    };
  }

  // Favoriten-Details laden
  const favTutorialIds = new Set(
    favourites
      .filter((f: any) => f.item_type === "tutorial")
      .map((f: any) => f.item_id),
  );
  const favRessourceIds = new Set(
    favourites
      .filter((f: any) => f.item_type === "ressource")
      .map((f: any) => f.item_id),
  );

  let favTutorials: any[] = [];
  let favRessourcen: any[] = [];
  if (favTutorialIds.size > 0) {
    const { data } = await supabase
      .from("tutorials")
      .select("*")
      .in("id", Array.from(favTutorialIds));
    favTutorials = data ?? [];
  }
  if (favRessourceIds.size > 0) {
    const { data } = await supabase
      .from("ressourcen")
      .select("*")
      .in("id", Array.from(favRessourceIds));
    favRessourcen = data ?? [];
  }

  const userInstrumentAreas = instrumentAreas.filter((a) =>
    userInstruments.includes(a.slug),
  );

  const tabs = ["allgemein", "mein-bereich"] as const;
  const tabLabels = { allgemein: "Allgemein", "mein-bereich": "Mein Bereich" };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
      <p className="text-gray-600 mb-6">{program.description}</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/programm/${slug}?tab=${t}`}
            className={`px-4 py-2 -mb-px border-b-2 transition ${
              tab === t
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500"
            }`}
          >
            {tabLabels[t]}
          </Link>
        ))}
      </div>

      {/* ALLGEMEIN */}
      {tab === "allgemein" && (
        <div className="flex flex-col gap-8">
          {/* Reguläre Bereiche (z.B. Gewächshaus) */}
          {regularAreas.length > 0 && (
            <section>
              <div className="flex flex-col gap-3">
                {regularAreas.map((area) => {
                  const { done, total } = areaProgress[area.id] ?? {
                    done: 0,
                    total: 0,
                  };
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <Link
                      key={area.id}
                      href={`/bereich/${area.slug}`}
                      className="border rounded-lg p-4 hover:shadow transition"
                    >
                      <h2 className="font-semibold text-lg mb-1">
                        {area.name}
                      </h2>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {done} / {total} Lektionen abgeschlossen
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Instrumente */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Ressourcen</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {instrumentAreas.map((area) => (
                <Link
                  key={area.id}
                  href={`/instrument/${area.slug}`}
                  className="border rounded-lg p-4 hover:shadow transition text-center"
                >
                  <p className="font-semibold">{area.name}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* MEIN BEREICH */}
      {tab === "mein-bereich" && (
        <div className="flex flex-col gap-8">
          {/* Favoriten */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Meine Favoriten</h2>
            {favTutorials.length === 0 && favRessourcen.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Noch keine Favoriten. Öffne ein Instrument und markiere
                Tutorials oder Ressourcen mit ★.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {favTutorials.map((t: any) => (
                  <Link
                    key={t.id}
                    href={`/tutorial/${t.id}`}
                    className="border rounded-lg p-3 hover:shadow transition flex items-center gap-2"
                  >
                    <span className="text-yellow-400">★</span>
                    <div>
                      <p className="font-medium text-sm">{t.title}</p>
                      <p className="text-xs text-gray-500">Tutorial</p>
                    </div>
                  </Link>
                ))}
                {favRessourcen.map((r: any) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded-lg p-3 hover:shadow transition flex items-center gap-2"
                  >
                    <span className="text-yellow-400">★</span>
                    <div>
                      <p className="font-medium text-sm">{r.title}</p>
                      <p className="text-xs text-gray-500">Ressource</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Meine Instrumente */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Meine Instrumente</h2>
              <Link
                href="/einstellungen"
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
            {userInstrumentAreas.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Noch keine Instrumente angegeben.{" "}
                <Link
                  href="/einstellungen"
                  className="text-blue-600 hover:underline"
                >
                  Jetzt hinzufügen
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {userInstrumentAreas.map((area) => (
                  <Link
                    key={area.id}
                    href={`/instrument/${area.slug}`}
                    className="border border-blue-200 bg-blue-50 rounded-lg p-4 hover:shadow transition text-center"
                  >
                    <p className="font-semibold text-blue-700">{area.name}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
