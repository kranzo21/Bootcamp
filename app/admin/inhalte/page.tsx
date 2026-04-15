// app/admin/inhalte/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminInhaltePage() {
  const db = createAdminClient();
  const [
    { data: programs },
    { data: areas },
    { data: lektionen },
    { data: tutorials },
    { data: ressourcen },
  ] = await Promise.all([
    db.from("programs").select("id, name").order("order"),
    db.from("areas").select("id, name, programs(name)").order("order"),
    db.from("lektionen").select("id, title, areas(name)").order("order"),
    db.from("tutorials").select("id, title, areas(name)").order("order"),
    db.from("ressourcen").select("id, title, areas(name)").order("order"),
  ]);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link
        href="/admin"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Admin
      </Link>
      <h1 className="text-3xl font-bold mb-8">Inhalte verwalten</h1>

      {/* Programme */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Programme</h2>
          <Link
            href="/admin/inhalte/neu?type=program"
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Neu
          </Link>
        </div>
        <div className="border rounded-lg divide-y">
          {(programs ?? []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-3">
              <span>{p.name}</span>
              <Link
                href={`/admin/inhalte/bearbeiten?type=program&id=${p.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Bereiche */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Bereiche</h2>
          <Link
            href="/admin/inhalte/neu?type=area"
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Neu
          </Link>
        </div>
        <div className="border rounded-lg divide-y">
          {(areas ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center justify-between p-3">
              <span>
                {(a.programs as any)?.name} → {a.name}
              </span>
              <Link
                href={`/admin/inhalte/bearbeiten?type=area&id=${a.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Lektionen */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Lektionen</h2>
          <Link
            href="/admin/inhalte/neu?type=lektion"
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Neu
          </Link>
        </div>
        <div className="border rounded-lg divide-y">
          {(lektionen ?? []).map((l: any) => (
            <div key={l.id} className="flex items-center justify-between p-3">
              <span>
                {(l.areas as any)?.name} → {l.title}
              </span>
              <Link
                href={`/admin/inhalte/bearbeiten?type=lektion&id=${l.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Tutorials */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Tutorials</h2>
          <Link
            href="/admin/inhalte/neu?type=tutorial"
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Neu
          </Link>
        </div>
        <div className="border rounded-lg divide-y">
          {(tutorials ?? []).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between p-3">
              <span>
                {(t.areas as any)?.name} → {t.title}
              </span>
              <Link
                href={`/admin/inhalte/bearbeiten?type=tutorial&id=${t.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                Bearbeiten
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
