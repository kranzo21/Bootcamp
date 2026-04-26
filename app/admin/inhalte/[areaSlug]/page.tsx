// app/admin/inhalte/[areaSlug]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminAreaPage({
  params,
}: {
  params: Promise<{ areaSlug: string }>;
}) {
  const { areaSlug } = await params;
  const db = createAdminClient();

  const { data: area } = await db
    .from("areas")
    .select("id, name, area_type")
    .eq("slug", areaSlug)
    .single();

  if (!area) notFound();

  const isInstrument = area.area_type === "instrument";

  const types = isInstrument
    ? [
        { label: "Tutorials", href: `/admin/inhalte/${areaSlug}/tutorials` },
        { label: "Ressourcen", href: `/admin/inhalte/${areaSlug}/ressourcen` },
      ]
    : [
        { label: "Lektionen", href: `/admin/inhalte/${areaSlug}/lektionen` },
        { label: "Module", href: `/admin/inhalte/${areaSlug}/module` },
        { label: "Tutorials", href: `/admin/inhalte/${areaSlug}/tutorials` },
        { label: "Ressourcen", href: `/admin/inhalte/${areaSlug}/ressourcen` },
      ];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/admin/inhalte"
        className="text-sm text-teal hover:underline mb-4 block"
      >
        ← Inhalte
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-8">
        {area.name}
      </h1>

      <div className="flex flex-col gap-3">
        {types.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="bg-white border border-border rounded-xl px-5 py-4 hover:shadow-sm transition-shadow flex items-center justify-between"
          >
            <span className="font-medium text-ink">{t.label}</span>
            <span className="text-gray-mid">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
