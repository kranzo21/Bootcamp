// app/admin/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminPage() {
  const db = createAdminClient();
  const { count: userCount } = await db
    .from("users")
    .select("*", { count: "exact", head: true });
  const { count: lektionenCount } = await db
    .from("lektionen")
    .select("*", { count: "exact", head: true });
  const { count: badgeCount } = await db
    .from("user_badges")
    .select("*", { count: "exact", head: true });

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{userCount ?? 0}</p>
          <p className="text-gray-500 text-sm">Nutzer</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{lektionenCount ?? 0}</p>
          <p className="text-gray-500 text-sm">Lektionen</p>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <p className="text-3xl font-bold">{badgeCount ?? 0}</p>
          <p className="text-gray-500 text-sm">Abzeichen vergeben</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/nutzer"
          className="border rounded-lg p-4 hover:shadow transition font-medium"
        >
          👥 Nutzerverwaltung
        </Link>
        <Link
          href="/admin/inhalte"
          className="border rounded-lg p-4 hover:shadow transition font-medium"
        >
          📚 Inhaltsverwaltung
        </Link>
        <Link
          href="/admin/qualifikationen"
          className="border rounded-lg p-4 hover:shadow transition font-medium"
        >
          🎓 Qualifikationen
        </Link>
      </div>
    </main>
  );
}
