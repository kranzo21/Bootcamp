// app/admin/inhalte/[areaSlug]/lektionen/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminLektionenPage({
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

  const { data: rawLektionen } = await db
    .from("lektionen")
    .select("id, title, status")
    .eq("area_id", area.id);

  const extractNum = (title: string) =>
    parseInt(title.match(/\d+/)?.[0] ?? "0", 10);
  const lektionen = (rawLektionen ?? []).sort((a, b) => {
    const diff = extractNum(a.title) - extractNum(b.title);
    return diff !== 0 ? diff : a.title.localeCompare(b.title, "de");
  });

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
          Lektionen
        </h1>
        <Link
          href={`/admin/inhalte/neu?type=lektion&areaId=${area.id}`}
          className="bg-teal text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          + Neue Lektion
        </Link>
      </div>

      {!lektionen || lektionen.length === 0 ? (
        <p className="text-gray-mid text-sm">Noch keine Lektionen vorhanden.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lektionen.map((l: any) => (
            <div
              key={l.id}
              className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    l.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {l.status === "published" ? "Live" : "Entwurf"}
                </span>
                <span className="font-medium text-ink">{l.title}</span>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/admin/inhalte/bearbeiten?type=lektion&id=${l.id}`}
                  className="text-sm text-teal hover:underline"
                >
                  Bearbeiten
                </Link>
                <Link
                  href={`/admin/inhalte/bearbeiten?type=lektion&id=${l.id}#quiz`}
                  className="text-sm text-gray-mid hover:text-teal hover:underline"
                >
                  Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
