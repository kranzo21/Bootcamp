// app/(app)/einstellungen/EinstellungenClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const INSTRUMENT_OPTIONS = [
  { value: "drums", label: "Drums" },
  { value: "keys", label: "Keys" },
  { value: "a-gitarre", label: "Akustikgitarre" },
  { value: "e-gitarre", label: "E-Gitarre" },
  { value: "bass", label: "Bass" },
  { value: "geige", label: "Geige" },
  { value: "vocals", label: "Vocals" },
];

export default function EinstellungenClient({
  name,
  email,
  instruments,
}: {
  name: string;
  email: string;
  instruments: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(instruments);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(value: string) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  }

  async function save() {
    setSaving(true);
    await fetch("/api/user-instruments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruments: selected }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-1">Name</p>
        <p className="font-medium">{name}</p>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-gray-500 mb-1">E-Mail</p>
        <p className="font-medium">{email}</p>
      </div>

      <div className="border rounded-lg p-4">
        <p className="text-sm font-medium mb-3">Meine Instrumente</p>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENT_OPTIONS.map((inst) => (
            <label
              key={inst.value}
              className={`flex items-center gap-1 cursor-pointer px-3 py-1 rounded-full border text-sm transition ${
                selected.includes(inst.value)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 text-gray-700 hover:border-blue-400"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selected.includes(inst.value)}
                onChange={() => toggle(inst.value)}
              />
              {inst.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Speichern..." : "Speichern"}
        </button>
        {saved && <span className="text-green-600 text-sm">✓ Gespeichert</span>}
        <Link href="/dashboard" className="text-sm text-gray-500 hover:underline ml-auto">
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}
