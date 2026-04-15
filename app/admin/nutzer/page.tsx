// app/admin/nutzer/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function AdminNutzerPage() {
  const db = createAdminClient();
  const { data: users } = await db
    .from("users")
    .select("id, name, email, is_admin, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-4xl mx-auto p-6">
      <Link
        href="/admin"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Admin
      </Link>
      <h1 className="text-3xl font-bold mb-6">Nutzer</h1>
      <div className="border rounded-lg divide-y">
        {(users ?? []).map((u: any) => (
          <Link
            key={u.id}
            href={`/admin/nutzer/${u.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
          >
            <div>
              <p className="font-medium">
                {u.name}{" "}
                {u.is_admin && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded ml-1">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">{u.email}</p>
            </div>
            <span className="text-gray-400 text-sm">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
