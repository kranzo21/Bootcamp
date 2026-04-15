import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminQualifikationenPage() {
  const db = createAdminClient();
  const { data: qualifications } = await db
    .from("qualifications")
    .select(
      "id, name, description, qualification_badges(badge_id, badges(name, icon))",
    );

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/admin"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Admin
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Qualifikationen</h1>
        <Link
          href="/admin/inhalte/neu?type=qualification"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          + Neue Qualifikation
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        {(qualifications ?? []).map((q: any) => (
          <div key={q.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-lg">🎓 {q.name}</h2>
              <Link
                href={`/admin/inhalte/bearbeiten?type=qualification&id=${q.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
            <p className="text-sm text-gray-500 mb-3">{q.description}</p>
            <div className="flex flex-wrap gap-2">
              {(q.qualification_badges ?? []).map((qb: any) => (
                <span
                  key={qb.badge_id}
                  className="bg-gray-100 rounded px-2 py-1 text-sm"
                >
                  {qb.badges?.icon} {qb.badges?.name}
                </span>
              ))}
            </div>
            {(q.qualification_badges ?? []).length === 0 && (
              <p className="text-xs text-gray-400">
                Noch keine Abzeichen zugeordnet. Füge
                „qualification_badges"-Einträge hinzu.
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
