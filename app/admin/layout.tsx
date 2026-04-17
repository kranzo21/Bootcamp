import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
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
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  return (
    <>
      {/* Admin Navbar */}
      <nav className="sticky top-0 z-50 bg-ink border-b border-ink/80">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-cream">
              Ecclesia
            </span>
            <span
              className="text-[7px] text-cream opacity-40 mt-0.5"
              style={{ letterSpacing: "3.5px", marginLeft: "-3.5px" }}
            >
              CHURCH
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[3px] text-tan font-semibold">
            Admin
          </span>
          <Link
            href="/dashboard"
            className="text-[11px] font-medium text-gray-mid hover:text-teal-light transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-5 py-8">{children}</main>
    </>
  );
}
