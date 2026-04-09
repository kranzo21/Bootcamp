import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getModules } from "@/lib/content/loader";
import TrackCard from "@/components/dashboard/TrackCard";
import type { Path, Progress } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, path")
    .eq("id", user.id)
    .single();

  const { data: progressRows } = await supabase
    .from("progress")
    .select("module_id, track, materials_completed, passed, completed_at")
    .eq("user_id", user.id);

  const path = (profile?.path ?? "instrumentalist") as Path;
  const progress = (progressRows ?? []) as Progress[];

  const theologieModules = getModules(path, "theologie");
  const theorieModules = getModules(path, "theorie");

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Hallo, {profile?.name}!</h1>
      <p className="text-gray-600 mb-8">
        Willkommen im Gewächshaus. Hier ist dein Fortschritt:
      </p>

      <div className="flex flex-col gap-6">
        <TrackCard
          track="theologie"
          modules={theologieModules}
          progress={progress}
        />
        <TrackCard
          track="theorie"
          modules={theorieModules}
          progress={progress}
        />
      </div>

      <form action="/api/logout" method="POST" className="mt-8">
        <button type="submit" className="text-sm text-gray-500 hover:underline">
          Abmelden
        </button>
      </form>
    </main>
  );
}
