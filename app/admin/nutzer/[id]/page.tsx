// app/admin/nutzer/[id]/page.tsx
import { createAdminClient } from "@/lib/supabase/admin";
import AdminUserDetail from "@/components/admin/AdminUserDetail";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = createAdminClient();

  const [
    { data: user },
    { data: programs },
    { data: badges },
    { data: qualifications },
    { data: userPrograms },
    { data: userBadges },
    { data: userQuals },
    { data: progress },
  ] = await Promise.all([
    db.from("users").select("id, name, email, is_admin").eq("id", id).single(),
    db.from("programs").select("id, name"),
    db.from("badges").select("id, name, icon, lektionen(title)"),
    db.from("qualifications").select("id, name"),
    db.from("user_programs").select("program_id").eq("user_id", id),
    db.from("user_badges").select("badge_id, earned_at").eq("user_id", id),
    db
      .from("user_qualifications")
      .select("qualification_id, confirmed_at")
      .eq("user_id", id),
    db
      .from("lektion_progress")
      .select("lektion_id, passed, completed_at")
      .eq("user_id", id),
  ]);

  if (!user) notFound();

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href="/admin/nutzer"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Nutzer
      </Link>
      <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
      <p className="text-gray-500 text-sm mb-6">{user.email}</p>
      <AdminUserDetail
        userId={id}
        programs={programs ?? []}
        badges={badges ?? []}
        qualifications={qualifications ?? []}
        userPrograms={(userPrograms ?? []).map((up: any) => up.program_id)}
        userBadges={userBadges ?? []}
        userQuals={userQuals ?? []}
        progress={progress ?? []}
      />
    </main>
  );
}
