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

  const [lektionen, progress, program] = await Promise.all([
    getLektionenByArea(area.id),
    getLektionProgress(user!.id),
    getProgramById(area.program_id),
  ]);

  const passedIds = new Set(
    progress.filter((p) => p.passed).map((p) => p.lektion_id),
  );

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href={`/programm/${program?.slug ?? ""}`}
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← {program?.name ?? "Zurück"}
      </Link>
      <h1 className="text-3xl font-bold mb-6">{area.name}</h1>

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
    </main>
  );
}
