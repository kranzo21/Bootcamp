// components/admin/ContentEditor.tsx
"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function ContentEditorInner() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type") ?? "";
  const id = params.get("id");
  const isEdit = Boolean(id);

  const [fields, setFields] = useState<Record<string, string>>({});
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
    if (type === "quiz_question") {
      try {
        data.options = JSON.parse(fields.options ?? "[]");
      } catch {
        setError("options muss ein JSON-Array sein");
        setSaving(false);
        return;
      }
      data.correct_index = parseInt(fields.correct_index);
    }
    if (fields.order !== undefined) data.order = parseInt(fields.order);

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
    router.push("/admin/inhalte");
  }

  async function deleteItem() {
    if (!confirm("Wirklich löschen?")) return;
    await fetch("/api/admin/content", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: tableMap[type], id }),
    });
    router.push("/admin/inhalte");
  }

  return (
    <main className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "Bearbeiten" : "Neu"}: {type}
      </h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="flex flex-col gap-4">
        {(fieldDefs[type] ?? []).map((f) => (
          <div key={f}>
            <label className="block text-sm font-medium mb-1">
              {f === "video_url"
                ? "YouTube-URL"
                : f === "instrument"
                  ? "Instrument (optional)"
                  : f === "area_id"
                    ? "Bereich-ID"
                    : f}
            </label>
            {f === "type" && type === "ressource" ? (
              <select
                value={fields[f] ?? ""}
                onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
                className="border rounded px-3 py-2 w-full"
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
                className="border rounded px-3 py-2 w-full"
                rows={4}
              />
            ) : (
              <input
                value={fields[f] ?? ""}
                onChange={(e) => setFields({ ...fields, [f]: e.target.value })}
                className="border rounded px-3 py-2 w-full"
                placeholder={
                  f === "video_url"
                    ? "https://www.youtube.com/watch?v=..."
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
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Speichern..." : "Speichern"}
          </button>
          {isEdit && (
            <button
              onClick={deleteItem}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
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
