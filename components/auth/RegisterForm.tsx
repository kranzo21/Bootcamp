"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INSTRUMENT_OPTIONS = [
  { value: "drums", label: "Drums" },
  { value: "keys", label: "Keys" },
  { value: "a-gitarre", label: "Akustikgitarre" },
  { value: "e-gitarre", label: "E-Gitarre" },
  { value: "bass", label: "Bass" },
  { value: "geige", label: "Geige" },
  { value: "vocals", label: "Vocals" },
];

export default function RegisterForm({
  programs,
}: {
  programs: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleInstrument(value: string) {
    setSelectedInstruments((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProgram) {
      setError("Bitte wähle ein Programm aus.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein.");
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
        if (selectedInstruments.length > 0) {
          await supabase
            .from("users")
            .update({ instruments: selectedInstruments })
            .eq("id", data.user.id);
        }
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full bg-white border border-border rounded-lg px-4 py-3 text-sm text-ink placeholder:text-tan focus:outline-none focus:border-teal transition-colors";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 w-full max-w-[320px]"
    >
      {error && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      <input
        type="text"
        placeholder="Vollständiger Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className={inputCls}
      />
      <input
        type="email"
        placeholder="E-Mail-Adresse"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className={inputCls}
      />
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Passwort (min. 6 Zeichen)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-mid text-xs"
        >
          {showPassword ? "Verbergen" : "Anzeigen"}
        </button>
      </div>
      <input
        type={showPassword ? "text" : "password"}
        placeholder="Passwort bestätigen"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={6}
        className={inputCls}
      />

      {/* Programme */}
      <div className="bg-white border border-border rounded-lg p-4">
        <p className="text-[8px] uppercase tracking-[2px] text-tan font-semibold mb-3">
          Programm wählen
        </p>
        <div className="flex flex-col gap-2">
          {programs.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="radio"
                name="program"
                value={p.id}
                checked={selectedProgram === p.id}
                onChange={() => setSelectedProgram(p.id)}
                className="accent-teal w-4 h-4"
              />
              <span className="text-sm text-ink">{p.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Instrumente */}
      <div className="bg-white border border-border rounded-lg p-4">
        <p className="text-[8px] uppercase tracking-[2px] text-tan font-semibold mb-3">
          Instrumente (optional)
        </p>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENT_OPTIONS.map((inst) => (
            <label
              key={inst.value}
              className={`flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                selectedInstruments.includes(inst.value)
                  ? "bg-teal text-teal-light border-teal"
                  : "border-border text-gray-mid hover:border-teal"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selectedInstruments.includes(inst.value)}
                onChange={() => toggleInstrument(inst.value)}
              />
              {inst.label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-ink text-cream font-semibold text-sm rounded-lg py-3 mt-1 hover:bg-ink/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Lädt…" : "Account erstellen"}
      </button>

      <p className="text-center text-[11px] text-gray-mid">
        Bereits registriert?{" "}
        <Link href="/login" className="text-teal font-semibold hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}
