// app/(app)/instrument/[slug]/page.tsx
import { createClient } from "@/lib/supabase/server";
import {
  getCachedAreaBySlug,
  getCachedProgramById,
  getCachedTutorialsByArea,
  getCachedRessourcenByArea,
} from "@/lib/db/cached";
import { getUserFavourites } from "@/lib/db/progress";
import InstrumentClient from "./InstrumentClient";
import { notFound } from "next/navigation";

export default async function InstrumentPage({
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

  const [tutorials, ressourcen, program, favourites] = await Promise.all([
    getCachedTutorialsByArea(area.id),
    getCachedRessourcenByArea(area.id),
    getCachedProgramById(area.program_id),
    getUserFavourites(user!.id),
  ]);

  const favIds = new Set(favourites.map((f: any) => f.item_id));

  return (
    <InstrumentClient
      area={area}
      programSlug={program?.slug ?? ""}
      programName={program?.name ?? "Zurück"}
      tutorials={tutorials}
      ressourcen={ressourcen}
      initialFavIds={Array.from(favIds)}
    />
  );
}
