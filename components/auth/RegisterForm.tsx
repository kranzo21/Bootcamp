"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolvePath } from "@/lib/path/resolver";
import type { Instrument } from "@/types";

const INSTRUMENTS: { id: Instrument; label: string }[] = [
  { id: "klavier", label: "Klavier" },
  { id: "gitarre", label: "Gitarre" },
  { id: "e-gitarre", label: "E-Gitarre" },
  { id: "bass", label: "Bass" },
  { id: "geige", label: "Geige" },
  { id: "vocals", label: "Gesang (Vocals)" },
  { id: "drums", label: "Schlagzeug" },
];

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<Instrument[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleInstrument(instrument: Instrument) {
    setSelectedInstruments((prev) =>
      prev.includes(instrument)
        ? prev.filter((i) => i !== instrument)
        : [...prev, instrument],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedInstruments.length === 0) {
      setError("Bitte wähle mindestens ein Instrument aus.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const path = resolvePath(selectedInstruments);

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
        const { error: updateError } = await supabase
          .from("users")
          .update({ instruments: selectedInstruments, path })
          .eq("id", data.user.id);

        if (updateError) {
          setError(
            "Profil konnte nicht gespeichert werden. Bitte versuche es erneut.",
          );
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
        <legend className="text-sm font-medium px-1">Meine Instrumente</legend>
        <div className="flex flex-col gap-2 mt-2">
          {INSTRUMENTS.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedInstruments.includes(id)}
                onChange={() => toggleInstrument(id)}
                className="w-4 h-4"
              />
              {label}
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
