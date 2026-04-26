// app/(app)/bereich/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getCachedAreaBySlug,
  getCachedProgramById,
  getCachedLektionenByArea,
} from "@/lib/db/cached";
import { getLektionProgress } from "@/lib/db/progress";
import Link from "next/link";
import { notFound } from "next/navigation";
import LektionenTab from "@/components/worship/LektionenTab";

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

  const area = await getCachedAreaBySlug(slug);
  if (!area) notFound();

  const [lektionen, progress, program, profileResult] = await Promise.all([
    getCachedLektionenByArea(area.id),
    getLektionProgress(user!.id),
    getCachedProgramById(area.program_id),
    supabase.from("users").select("is_admin").eq("id", user!.id).single(),
  ]);

  const passedIds = progress.filter((p) => p.passed).map((p) => p.lektion_id);
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

      <LektionenTab
        lektionen={lektionen}
        passedIds={passedIds}
        isAdmin={isAdmin}
        areaId={area.id}
      />
    </div>
  );
}
