import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppNav from "@/components/ui/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, programsResult] = await Promise.all([
    supabase.from("users").select("name, is_admin").eq("id", user.id).single(),
    supabase
      .from("user_programs")
      .select("programs(name)")
      .eq("user_id", user.id),
  ]);

  const name: string = profileResult.data?.name ?? "";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const programNames: string[] = (programsResult.data ?? [])
    .map((row: any) => row.programs?.name)
    .filter(Boolean);

  return (
    <>
      <AppNav
        initials={initials}
        isAdmin={profileResult.data?.is_admin ?? false}
        name={name}
        programs={programNames}
      />
      <main className="max-w-3xl mx-auto px-5 py-6">{children}</main>
    </>
  );
}
