import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getModules } from "@/lib/content/loader";
import UserDetail from "@/components/admin/UserDetail";
import type { Path, Progress } from "@/types";

interface Props {
  params: Promise<{ userId: string }>;
}

function daysSince(dateString: string): number {
  return Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24),
  );
}

const PATH_LABELS: Record<string, string> = {
  instrumentalist: "Instrumentalist",
  vocals: "Gesang",
  drums: "Schlagzeug",
};

export default async function AdminUserPage({ params }: Props) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("name, email, path, instruments, created_at")
    .eq("id", userId)
    .single();

  if (!user) notFound();

  const { data: progressRows } = await supabase
    .from("progress")
    .select("module_id, track, materials_completed, passed, completed_at")
    .eq("user_id", userId);

  const path = user.path as Path;
  const progress = (progressRows ?? []) as Progress[];

  return (
    <>
      <a
        href="/admin"
        className="text-blue-600 text-sm hover:underline mb-4 block"
      >
        ← Alle Nutzer
      </a>

      <div className="mb-6">
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-gray-600 text-sm">{user.email}</p>
        <p className="text-sm mt-1">
          Pfad: <strong>{PATH_LABELS[path]}</strong> · Im Gewächshaus seit{" "}
          {daysSince(user.created_at)} Tagen · Start:{" "}
          {new Date(user.created_at).toLocaleDateString("de-DE")}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Instrumente: {user.instruments.join(", ")}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <UserDetail
          track="theologie"
          modules={getModules(path, "theologie")}
          progress={progress}
        />
        <UserDetail
          track="theorie"
          modules={getModules(path, "theorie")}
          progress={progress}
        />
      </div>
    </>
  );
}
