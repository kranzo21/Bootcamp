// app/(app)/einstellungen/page.tsx
import { createClient } from "@/lib/supabase/server";
import EinstellungenClient from "./EinstellungenClient";

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, instruments")
    .eq("id", user!.id)
    .single();

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Account-Einstellungen</h1>
      <EinstellungenClient
        name={profile?.name ?? ""}
        email={profile?.email ?? ""}
        instruments={profile?.instruments ?? []}
      />
    </main>
  );
}
