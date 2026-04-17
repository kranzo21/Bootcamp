// app/admin/inhalte/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminInhaltePage() {
  const db = createAdminClient();
  const { data: programs } = await db
    .from("programs")
    .select("id, name, slug")
    .order("order");

  const { data: areas } = await db
    .from("areas")
    .select("id, name, slug, area_type, program_id")
    .order("order");

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/admin"
        className="text-sm text-teal hover:underline mb-4 block"
      >
        ← Admin
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-8">
        Inhalte verwalten
      </h1>

      {(programs ?? []).map((program: any) => {
        const programAreas = (areas ?? []).filter(
          (a: any) => a.program_id === program.id,
        );
        const regular = programAreas.filter(
          (a: any) => a.area_type === "regular",
        );
        const instruments = programAreas.filter(
          (a: any) => a.area_type === "instrument",
        );

        return (
          <section key={program.id} className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-mid mb-3">
              {program.name}
            </h2>

            {regular.length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                {regular.map((area: any) => (
                  <Link
                    key={area.id}
                    href={`/admin/inhalte/${area.slug}`}
                    className="bg-white border border-border rounded-xl px-4 py-3 hover:shadow-sm transition-shadow flex items-center justify-between"
                  >
                    <span className="font-medium text-ink">{area.name}</span>
                    <span className="text-gray-mid text-sm">→</span>
                  </Link>
                ))}
              </div>
            )}

            {instruments.length > 0 && (
              <>
                <p className="text-xs text-gray-mid mb-2 ml-1">Instrumente</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {instruments.map((area: any) => (
                    <Link
                      key={area.id}
                      href={`/admin/inhalte/${area.slug}`}
                      className="bg-white border border-border rounded-xl px-4 py-3 hover:shadow-sm transition-shadow text-center"
                    >
                      <span className="font-medium text-ink text-sm">
                        {area.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        );
      })}
    </main>
  );
}
