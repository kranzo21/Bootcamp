"use client";
import { useState } from "react";

interface Modul {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

interface Props {
  areaId: string;
  initialModules: Modul[];
}

export default function ModuleAdminClient({ areaId, initialModules }: Props) {
  const [modules, setModules] = useState<Modul[]>(initialModules);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!newName.trim()) return;
    setSaving(true);
    const nextOrder =
      modules.length > 0 ? Math.max(...modules.map((m) => m.order)) + 1 : 1;
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "modules",
        data: {
          area_id: areaId,
          name: newName.trim(),
          description: newDesc.trim() || null,
          order: nextOrder,
        },
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setModules((prev) => [...prev, created]);
      setNewName("");
      setNewDesc("");
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Modul löschen? Lektionen verlieren ihre Modul-Zuordnung, bleiben aber erhalten.",
      )
    )
      return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "modules", id }),
    });
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {modules.length === 0 && (
          <p className="text-gray-mid text-sm">Noch keine Module.</p>
        )}
        {modules.map((m) => (
          <div
            key={m.id}
            className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-ink">{m.name}</p>
              {m.description && (
                <p className="text-xs text-gray-mid">{m.description}</p>
              )}
            </div>
            <button
              onClick={() => remove(m.id)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors ml-4 flex-shrink-0"
            >
              Löschen
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-ink mb-3">Neues Modul</h2>
        <div className="flex flex-col gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="border rounded px-3 py-2 w-full text-sm"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Beschreibung (optional)"
            className="border rounded px-3 py-2 w-full text-sm"
          />
          <button
            onClick={create}
            disabled={saving || !newName.trim()}
            className="bg-teal text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 self-start"
          >
            {saving ? "Speichern…" : "Modul anlegen"}
          </button>
        </div>
      </div>
    </div>
  );
}
