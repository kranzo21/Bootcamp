// app/(app)/bereich/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getAreaBySlug,
  getTutorialsByArea,
  getRessourcenByArea,
} from "@/lib/db/programs";
import { getLektionenByArea } from "@/lib/db/lektionen";
import { getLektionProgress } from "@/lib/db/progress";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab = "lektionen" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const area = await getAreaBySlug(slug);
  if (!area) notFound();

  const [lektionen, tutorials, ressourcen, progress] = await Promise.all([
    getLektionenByArea(area.id),
    getTutorialsByArea(area.id),
    getRessourcenByArea(area.id),
    getLektionProgress(user!.id),
  ]);

  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  const tabs = ["lektionen", "tutorials", "ressourcen"] as const;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="javascript:history.back()"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Zurück
      </Link>
      <h1 className="text-3xl font-bold mb-6">{area.name}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/bereich/${slug}?tab=${t}`}
            className={`px-4 py-2 capitalize -mb-px border-b-2 transition ${
              tab === t
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Link>
        ))}
      </div>

      {/* Lektionen */}
      {tab === "lektionen" && (
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
                <p className="text-sm text-gray-500">{l.description}</p>
              </div>
              {passedIds.has(l.id) && (
                <span className="text-green-600 text-xl">✓</span>
              )}
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
