// app/(app)/programm/[slug]/page.tsx
import {
  getProgramBySlug,
  getAreasByProgram,
  getTutorialsByProgram,
  getRessourcenByProgram,
} from "@/lib/db/programs";
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
  const { tab = "bereiche" } = await searchParams;

  const program = await getProgramBySlug(slug);
  if (!program) notFound();

  const [areas, tutorials, ressourcen] = await Promise.all([
    getAreasByProgram(program.id),
    getTutorialsByProgram(program.id),
    getRessourcenByProgram(program.id),
  ]);

  const tabs = ["bereiche", "tutorials", "ressourcen"] as const;
  const tabLabels = {
    bereiche: "Bereiche",
    tutorials: "Tutorials",
    ressourcen: "Ressourcen",
  };

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

      {/* Bereiche */}
      {tab === "bereiche" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {areas.length === 0 && (
            <p className="text-gray-500">Noch keine Bereiche vorhanden.</p>
          )}
          {areas.map((area) => (
            <Link
              key={area.id}
              href={`/bereich/${area.slug}`}
              className="border rounded-lg p-4 hover:shadow transition"
            >
              <h2 className="font-semibold text-lg">{area.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{area.description}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Tutorials */}
      {tab === "tutorials" && (
        <div className="flex flex-col gap-3">
          {tutorials.length === 0 && (
            <p className="text-gray-500">Noch keine Tutorials vorhanden.</p>
          )}
          {tutorials.map((t) => (
            <Link
              key={t.id}
              href={`/tutorial/${t.id}`}
              className="border rounded-lg p-4 hover:shadow transition"
            >
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-sm text-gray-500">{t.description}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Ressourcen */}
      {tab === "ressourcen" && (
        <div className="flex flex-col gap-3">
          {ressourcen.length === 0 && (
            <p className="text-gray-500">Noch keine Ressourcen vorhanden.</p>
          )}
          {ressourcen.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-4 hover:shadow transition flex items-center gap-3"
            >
              <span className="text-xl">
                {r.type === "pdf" ? "📄" : r.type === "dokument" ? "📝" : "🔗"}
              </span>
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="text-sm text-gray-500">{r.description}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
