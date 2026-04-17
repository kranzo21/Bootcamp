"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("E-Mail oder Passwort falsch.");
        return;
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
      className="flex flex-col gap-3 w-full max-w-[300px]"
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
        type="email"
        placeholder="E-Mail-Adresse"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="bg-white border border-border rounded-lg px-4 py-3 text-sm text-ink placeholder:text-tan focus:outline-none focus:border-teal transition-colors"
      />

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-white border border-border rounded-lg px-4 py-3 text-sm text-ink placeholder:text-tan focus:outline-none focus:border-teal transition-colors"
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-mid text-xs"
        >
          {showPassword ? "Verbergen" : "Anzeigen"}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-ink text-cream font-semibold text-sm rounded-lg py-3 mt-1 hover:bg-ink/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Lädt…" : "Anmelden"}
      </button>

      <p className="text-center text-[11px] text-gray-mid mt-2">
        Noch kein Konto?{" "}
        <Link
          href="/registrieren"
          className="text-teal font-semibold hover:underline"
        >
          Registrieren
        </Link>
      </p>
    </form>
  );
}
