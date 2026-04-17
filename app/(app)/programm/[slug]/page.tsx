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

  const tabs = [
    { key: "gewaechshaus", label: "Gewächshaus" },
    { key: "tutorials", label: "Tutorials" },
    { key: "ressourcen", label: "Ressourcen" },
  ];

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
      <div className="flex gap-3 mb-6">
        {/* Gewächshaus Tab — mit Fortschritt */}
        <Link
          href={`/programm/${slug}?tab=gewaechshaus`}
          className={`flex-1 border rounded-xl p-4 transition hover:shadow-sm ${
            tab === "gewaechshaus"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <p
            className={`font-semibold text-sm mb-2 ${tab === "gewaechshaus" ? "text-blue-700" : "text-gray-700"}`}
          >
            Gewächshaus
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all"
              style={{
                width:
                  lektionen.length > 0
                    ? `${Math.round((Array.from(passedIds).filter((id) => lektionen.some((l) => l.id === id)).length / lektionen.length) * 100)}%`
                    : "0%",
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
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
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <p
            className={`font-semibold text-sm ${tab === "tutorials" ? "text-blue-700" : "text-gray-700"}`}
          >
            Tutorials
          </p>
        </Link>

        {/* Ressourcen Tab */}
        <Link
          href={`/programm/${slug}?tab=ressourcen`}
          className={`flex-1 border rounded-xl p-4 transition hover:shadow-sm flex items-center justify-center ${
            tab === "ressourcen"
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <p
            className={`font-semibold text-sm ${tab === "ressourcen" ? "text-blue-700" : "text-gray-700"}`}
          >
            Ressourcen
          </p>
        </Link>
      </div>

      {/* GEWÄCHSHAUS */}
      {tab === "gewaechshaus" && (
        <div className="flex flex-col gap-3">
          {lektionen.length === 0 && (
            <p className="text-gray-500">Noch keine Lektionen vorhanden.</p>
          )}
          {lektionen.map((l) => (
            <Link
              key={l.id}
              href={`/lektion/${l.id}`}
              className="border rounded-lg p-4 hover:shadow transition flex items-center justify-between"
            >
              <div>
                <h3 className="font-semibold">{l.title}</h3>
                {l.description && (
                  <p className="text-sm text-gray-500">{l.description}</p>
                )}
              </div>
              {passedIds.has(l.id) && (
                <span className="text-green-600 text-xl">✓</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* TUTORIALS */}
      {tab === "tutorials" && <TutorialsTab tutorials={tutorials} />}

      {/* RESSOURCEN */}
      {tab === "ressourcen" && <RessourcenTab ressourcen={ressourcen} />}
    </main>
  );
}
