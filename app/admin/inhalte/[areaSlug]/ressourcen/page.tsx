// app/admin/inhalte/[areaSlug]/ressourcen/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminRessourcenPage({
  params,
}: {
  params: Promise<{ areaSlug: string }>;
}) {
  const { areaSlug } = await params;
  const db = createAdminClient();

  const { data: area } = await db
    .from("areas")
    .select("id, name")
    .eq("slug", areaSlug)
    .single();

  if (!area) notFound();

  const { data: ressourcen } = await db
    .from("ressourcen")
    .select("id, title, type, instrument")
    .eq("area_id", area.id)
    .order("order");

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href={`/admin/inhalte/${areaSlug}`}
        className="text-sm text-teal hover:underline mb-4 block"
      >
        ← {area.name}
      </Link>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Ressourcen
        </h1>
        <Link
          href={`/admin/inhalte/neu?type=ressource&areaId=${area.id}`}
          className="bg-teal text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Neue Ressource
        </Link>
      </div>

      {!ressourcen || ressourcen.length === 0 ? (
        <p className="text-gray-mid text-sm">
          Noch keine Ressourcen vorhanden.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {ressourcen.map((r: any) => (
            <div
              key={r.id}
              className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div>
                <span className="font-medium text-ink">{r.title}</span>
                <span className="ml-2 text-xs text-gray-mid uppercase">
                  {r.type}
                  {r.instrument ? ` · ${r.instrument}` : ""}
                </span>
              </div>
              <Link
                href={`/admin/inhalte/bearbeiten?type=ressource&id=${r.id}`}
                className="text-sm text-teal hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
