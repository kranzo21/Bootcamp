// components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterForm({
  programs,
}: {
  programs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProgram) {
      setError("Bitte wähle ein Programm aus.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user) {
        if (data.session) await supabase.auth.setSession(data.session);
        const { error: enrollError } = await supabase
          .from("user_programs")
          .insert({ user_id: data.user.id, program_id: selectedProgram });
        if (enrollError) {
          setError(`Einschreibung fehlgeschlagen: ${enrollError.message}`);
          return;
        }
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold text-center">Registrieren</h1>
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border rounded px-3 py-2"
      />
      <input
        type="password"
        placeholder="Passwort (min. 6 Zeichen)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
        className="border rounded px-3 py-2"
      />
      <fieldset className="border rounded p-3">
        <legend className="text-sm font-medium px-1">Programm wählen</legend>
        <div className="flex flex-col gap-2 mt-2">
          {programs.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="program"
                value={p.id}
                checked={selectedProgram === p.id}
                onChange={() => setSelectedProgram(p.id)}
                className="w-4 h-4"
              />
              {p.name}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Lädt..." : "Account erstellen"}
      </button>
      <p className="text-center text-sm">
        Bereits registriert?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
