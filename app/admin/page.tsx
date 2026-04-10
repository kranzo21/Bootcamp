import { createClient } from "@/lib/supabase/server";
import { getModules } from "@/lib/content/loader";
import UserTable from "@/components/admin/UserTable";
import type { Path } from "@/types";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, name, email, path, instruments, created_at")
    .eq("is_admin", false)
    .order("created_at", { ascending: false });

  const { data: allProgress } = await supabase
    .from("progress")
    .select("user_id, module_id, track, passed");

  const usersWithProgress = (users ?? []).map((user) => {
    const validPaths = ["instrumentalist", "vocals", "drums"] as const;
    const path = (
      validPaths.includes(user.path as Path) ? user.path : "instrumentalist"
    ) as Path;
    const totalModules =
      getModules(path, "theologie").length + getModules(path, "theorie").length;
    const passedModules = (allProgress ?? []).filter(
      (p) =>
        p.user_id === user.id &&
        p.passed &&
        (p.track === "theologie" || p.track === "theorie"),
    ).length;
    const progressPercent =
      totalModules > 0 ? (passedModules / totalModules) * 100 : 0;

    return { ...user, progressPercent };
  });

  return (
    <>
      <p className="text-gray-600 mb-4">
        {usersWithProgress.length} Nutzer registriert
      </p>
      <UserTable users={usersWithProgress} />
    </>
  );
}
