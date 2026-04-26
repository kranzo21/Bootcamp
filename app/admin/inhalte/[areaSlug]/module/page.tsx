import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import ModuleAdminClient from "./ModuleAdminClient";

export default async function AdminModulePage({
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

  const { data: modules } = await db
    .from("modules")
    .select("*")
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
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-8">
        Module
      </h1>
      <ModuleAdminClient areaId={area.id} initialModules={modules ?? []} />
    </main>
  );
}
