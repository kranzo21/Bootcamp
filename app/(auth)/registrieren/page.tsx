// app/(auth)/registrieren/page.tsx
import { createClient } from "@/lib/supabase/server";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, name")
    .order("order");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <RegisterForm programs={programs ?? []} />
    </main>
  );
}
