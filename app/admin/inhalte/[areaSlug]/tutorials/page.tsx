// app/admin/inhalte/[areaSlug]/tutorials/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminTutorialsPage({
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

  const { data: tutorials } = await db
    .from("tutorials")
    .select("id, title, instrument")
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
          Tutorials
        </h1>
        <Link
          href={`/admin/inhalte/neu?type=tutorial&areaId=${area.id}`}
          className="bg-teal text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Neues Tutorial
        </Link>
      </div>

      {!tutorials || tutorials.length === 0 ? (
        <p className="text-gray-mid text-sm">Noch keine Tutorials vorhanden.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tutorials.map((t: any) => (
            <div
              key={t.id}
              className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div>
                <span className="font-medium text-ink">{t.title}</span>
                {t.instrument && (
                  <span className="ml-2 text-xs text-gray-mid">
                    ({t.instrument})
                  </span>
                )}
              </div>
              <Link
                href={`/admin/inhalte/bearbeiten?type=tutorial&id=${t.id}`}
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
