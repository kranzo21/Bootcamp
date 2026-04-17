// app/(app)/bereich/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getAreaBySlug, getProgramById } from "@/lib/db/programs";
import { getLektionenByArea } from "@/lib/db/lektionen";
import { getLektionProgress } from "@/lib/db/progress";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const area = await getAreaBySlug(slug);
  if (!area) notFound();

  const [lektionen, progress, program, profileResult] = await Promise.all([
    getLektionenByArea(area.id),
    getLektionProgress(user!.id),
    getProgramById(area.program_id),
    supabase.from("users").select("is_admin").eq("id", user!.id).single(),
  ]);

  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );
  const isAdmin = profileResult.data?.is_admin ?? false;

  return (
    <div>
      <Link
        href={`/programm/${program?.slug ?? ""}`}
        className="text-sm text-teal hover:underline mb-4 block"
      >
        ← {program?.name ?? "Zurück"}
      </Link>

      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {area.name}
        </h1>
        {isAdmin && (
          <Link
            href={`/admin/inhalte/${slug}/lektionen`}
            title="Bereich bearbeiten"
            className="text-gray-mid hover:text-teal transition-colors"
          >
            ✏️
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {lektionen.length === 0 && (
          <p className="text-gray-mid text-sm">
            Noch keine Lektionen vorhanden.
          </p>
        )}
        {lektionen.map((l) => (
          <div key={l.id} className="relative">
            <Link
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
                <span className="text-teal text-lg ml-3">✓</span>
              )}
            </Link>
            {isAdmin && (
              <Link
                href={`/admin/inhalte/bearbeiten?type=lektion&id=${l.id}`}
                title="Lektion bearbeiten"
                className="absolute top-3 right-3 text-gray-mid hover:text-teal transition-colors text-xs"
              >
                ✏️
              </Link>
            )}
          </div>
        ))}
        {isAdmin && (
          <Link
            href={`/admin/inhalte/neu?type=lektion&areaId=${area.id}`}
            className="border border-dashed border-border rounded-xl p-4 text-center text-sm text-gray-mid hover:text-teal hover:border-teal transition-colors"
          >
            + Neue Lektion
          </Link>
        )}
      </div>
    </div>
  );
}
