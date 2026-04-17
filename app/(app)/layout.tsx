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

  const { data: profile } = await supabase
    .from("users")
    .select("name, is_admin")
    .eq("id", user.id)
    .single();

  const name: string = profile?.name ?? "";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <AppNav initials={initials} isAdmin={profile?.is_admin ?? false} />
      <main className="max-w-3xl mx-auto px-5 py-6">{children}</main>
    </>
  );
}
