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
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/programm/${slug}?tab=${t.key}`}
            className={`px-4 py-2 -mb-px border-b-2 transition ${
              tab === t.key
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500"
            }`}
          >
            {t.label}
          </Link>
        ))}
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
