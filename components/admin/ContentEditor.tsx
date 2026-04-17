// components/admin/ContentEditor.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  slug: "URL-Kürzel (slug)",
  description: "Beschreibung",
  order: "Reihenfolge",
  program_id: "Programm-ID",
  area_id: "Bereich",
  lektion_id: "Lektion-ID",
  tutorial_id: "Tutorial-ID",
  title: "Titel",
  video_url: "YouTube-URL",
  instrument: "Instrument (optional)",
  url: "Link-URL",
  type: "Typ",
  content: "Inhalt",
  question: "Frage",
  options: "Antwortmöglichkeiten (JSON-Array)",
  correct_index: "Richtige Antwort (0–3)",
  icon: "Icon",
};

function ContentEditorInner() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type") ?? "";
  const id = params.get("id");
  const prefilledAreaId = params.get("areaId") ?? "";
  const isEdit = Boolean(id);

  const [fields, setFields] = useState<Record<string, string>>({
    area_id: prefilledAreaId,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldDefs: Record<string, string[]> = {
    program: ["name", "slug", "description", "order"],
    area: ["name", "slug", "description", "order", "program_id"],
    lektion: ["title", "description", "order", "area_id"],
    tutorial: [
      "title",
      "video_url",
      "description",
      "instrument",
      "order",
      "area_id",
    ],
    ressource: [
      "title",
      "type",
      "description",
      "url",
      "instrument",
      "order",
      "area_id",
    ],
    material: [
      "title",
      "type",
      "content",
      "video_url",
      "order",
      "lektion_id",
      "tutorial_id",
    ],
    quiz_question: [
      "question",
      "options",
      "correct_index",
      "order",
      "lektion_id",
    ],
    badge: ["name", "icon", "description", "lektion_id"],
    qualification: ["name", "description"],
  };

  // Fields hidden from UI (pre-filled or not user-facing)
  const hiddenFields = new Set([
    "area_id",
    "lektion_id",
    "tutorial_id",
    "program_id",
  ]);

  const tableMap: Record<string, string> = {
    program: "programs",
    area: "areas",
    lektion: "lektionen",
    tutorial: "tutorials",
    ressource: "ressourcen",
    material: "materials",
    quiz_question: "quiz_questions",
    badge: "badges",
    qualification: "qualifications",
  };

  useEffect(() => {
    if (isEdit && id) {
      fetch(`/api/admin/content-get?table=${tableMap[type]}&id=${id}`)
        .then((r) => r.json())
        .then((data) => {
          const mapped: Record<string, string> = {};
          for (const f of fieldDefs[type] ?? []) {
            mapped[f] =
              data[f] !== null && data[f] !== undefined ? String(data[f]) : "";
          }
          setFields(mapped);
        });
    }
  }, [id, type]);

  async function save() {
    setSaving(true);
    setError(null);
    const data: Record<string, any> = { ...fields };

    // Pre-fill hidden area_id from URL if not already set
    if (prefilledAreaId && !data.area_id) {
      data.area_id = prefilledAreaId;
    }

    if (type === "quiz_question") {
      try {
        data.options = JSON.parse(fields.options ?? "[]");
      } catch {
        setError("Antworten müssen als JSON-Array angegeben werden");
        setSaving(false);
        return;
      }
      data.correct_index = parseInt(fields.correct_index);
    }
    if (fields.order !== undefined && fields.order !== "") {
      data.order = parseInt(fields.order);
    }

    const res = await fetch("/api/admin/content", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tableMap[type], id, data }),
    });
    if (!res.ok) {
      const e = await res.json();
      setError(e.error);
      setSaving(false);
      return;
    }
    router.back();
  }

  async function deleteItem() {
    if (!confirm("Wirklich löschen?")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tableMap[type], id }),
    });
    router.back();
  }

  const visibleFields = (fieldDefs[type] ?? []).filter(
    (f) => !(hiddenFields.has(f) && (prefilledAreaId || isEdit)),
  );

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-6">
        {isEdit ? "Bearbeiten" : "Neu"}: {type}
      </h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="flex flex-col gap-4">
        {visibleFields.map((f) => (
          <div key={f}>
            <label className="block text-sm font-medium text-ink mb-1">
              {FIELD_LABELS[f] ?? f}
            </label>
            {f === "type" && type === "ressource" ? (
              <select
                value={fields[f] ?? ""}
                onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 w-full text-sm"
              >
                <option value="">— Typ wählen —</option>
                <option value="pdf">PDF</option>
                <option value="audio">Audio</option>
                <option value="image">Bild</option>
                <option value="youtube">YouTube</option>
              </select>
            ) : f === "content" || f === "description" ? (
              <textarea
                value={fields[f] ?? ""}
                onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 w-full text-sm"
                rows={4}
              />
            ) : f === "order" ? (
              <input
                type="number"
                value={fields[f] ?? "0"}
                onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 w-32 text-sm"
              />
            ) : (
              <input
                value={fields[f] ?? ""}
                onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 w-full text-sm"
                placeholder={
                  f === "video_url"
                    ? "https://www.youtube.com/watch?v=..."
                    : f === "url"
                      ? "https://..."
                      : undefined
                }
              />
            )}
          </div>
        ))}
        <div className="flex gap-3 mt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-teal text-white px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
          {isEdit && (
            <button
              onClick={deleteItem}
              className="border border-red-200 text-red-600 px-5 py-2 rounded-lg hover:bg-red-50 text-sm"
            >
              Löschen
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ContentEditor() {
  return (
    <Suspense>
      <ContentEditorInner />
    </Suspense>
  );
}
