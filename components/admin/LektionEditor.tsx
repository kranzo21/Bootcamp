// components/admin/LektionEditor.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import QuizEditor from "./QuizEditor";
import type { QuizQuestion } from "@/types";

interface Props {
  lektionId?: string;
}

export default function LektionEditor({ lektionId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = Boolean(lektionId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState(searchParams.get("areaId") ?? "");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPosition, setVideoPosition] = useState<"above" | "below">(
    "above",
  );
  const [h5pContentPath, setH5pContentPath] = useState("");
  const [order, setOrder] = useState("0");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [areas, setAreas] = useState<{ id: string; name: string }[]>([]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
  });

  useEffect(() => {
    fetch("/api/admin/areas-list")
      .then((r) => r.json())
      .then(setAreas)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !lektionId || !editor) return;
    fetch(`/api/admin/content-get?table=lektionen&id=${lektionId}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setAreaId(data.area_id ?? "");
        setVideoUrl(data.video_url ?? "");
        setVideoPosition(data.video_position ?? "above");
        setH5pContentPath(data.h5p_content_path ?? "");
        setOrder(String(data.order ?? 0));
        setStatus(data.status ?? "published");
        if (data.content) editor.commands.setContent(data.content);
      });

    fetch(`/api/admin/quiz-list?lektionId=${lektionId}`)
      .then((r) => r.json())
      .then(setQuizQuestions)
      .catch(() => {});
  }, [isEdit, lektionId, editor]);

  async function save(saveStatus: "draft" | "published") {
    setSaving(true);
    setError(null);
    const content = editor?.getHTML() ?? "";
    const body = {
      title,
      description,
      area_id: areaId,
      video_url: videoUrl || null,
      video_position: videoPosition,
      h5p_content_path: h5pContentPath || null,
      order: parseInt(order),
      content,
      status: saveStatus,
    };

    const res = await fetch("/api/admin/content", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "lektionen", id: lektionId, data: body }),
    });

    if (!res.ok) {
      const e = await res.json();
      setError(e.error);
      setSaving(false);
      return;
    }
    router.back();
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? "Lektion bearbeiten" : "Neue Lektion"}
      </h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Beschreibung (kurz)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bereich</label>
          {areas.length > 0 ? (
            <select
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            >
              <option value="">— Bereich wählen —</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              placeholder="area_id"
              className="border rounded px-3 py-2 w-full"
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            YouTube-URL (optional)
          </label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Video-Position
          </label>
          <select
            value={videoPosition}
            onChange={(e) =>
              setVideoPosition(e.target.value as "above" | "below")
            }
            className="border rounded px-3 py-2 w-full"
          >
            <option value="above">Oben (vor Text)</option>
            <option value="below">Unten (nach Text)</option>
          </select>
        </div>

        {/* H5P */}
        <div className="border border-border rounded-xl p-4 bg-gray-50">
          <label className="block text-sm font-semibold mb-1">
            H5P-Inhalt (optional)
          </label>
          <p className="text-xs text-gray-mid mb-3">
            Erstelle H5P-Inhalte mit{" "}
            <a
              href="https://lumi.education"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:underline"
            >
              Lumi Desktop
            </a>
            , exportiere als <code className="bg-white px-1 rounded">.h5p</code>
            , entpacke den Inhalt nach{" "}
            <code className="bg-white px-1 rounded">
              public/h5p-content/[name]/
            </code>{" "}
            und trage den Pfad hier ein.
          </p>
          <input
            value={h5pContentPath}
            onChange={(e) => setH5pContentPath(e.target.value)}
            placeholder="/h5p-content/mein-quiz"
            className="border rounded px-3 py-2 w-full bg-white text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reihenfolge</label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="border rounded px-3 py-2 w-32"
          />
        </div>

        {/* Tiptap Editor */}
        <div>
          <label className="block text-sm font-medium mb-2">Inhalt</label>
          <div className="flex gap-1 border border-b-0 rounded-t px-2 py-1 bg-gray-50">
            {[
              {
                label: "B",
                action: () => editor?.chain().focus().toggleBold().run(),
                title: "Fett",
              },
              {
                label: "I",
                action: () => editor?.chain().focus().toggleItalic().run(),
                title: "Kursiv",
              },
              {
                label: "H2",
                action: () =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run(),
                title: "Überschrift 2",
              },
              {
                label: "H3",
                action: () =>
                  editor?.chain().focus().toggleHeading({ level: 3 }).run(),
                title: "Überschrift 3",
              },
              {
                label: "• Liste",
                action: () => editor?.chain().focus().toggleBulletList().run(),
                title: "Aufzählung",
              },
              {
                label: "1. Liste",
                action: () => editor?.chain().focus().toggleOrderedList().run(),
                title: "Nummerierte Liste",
              },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={btn.action}
                title={btn.title}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-200"
              >
                {btn.label}
              </button>
            ))}
          </div>
          <EditorContent
            editor={editor}
            className="border rounded-b min-h-48 px-3 py-2 prose prose-sm max-w-none focus-within:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => save("draft")}
          disabled={saving}
          className="border border-border text-ink px-5 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
        >
          {saving ? "Speichern..." : "Als Entwurf speichern"}
        </button>
        <button
          onClick={() => save("published")}
          disabled={saving}
          className="bg-teal text-white px-5 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
        >
          {saving ? "Speichern..." : "Veröffentlichen"}
        </button>
      </div>
      {status === "draft" && (
        <p className="text-xs text-yellow-600 mt-2">Aktuell: Entwurf</p>
      )}
      {status === "published" && (
        <p className="text-xs text-green-600 mt-2">Aktuell: Live</p>
      )}

      {isEdit && lektionId && (
        <div id="quiz">
          <QuizEditor lektionId={lektionId} initialQuestions={quizQuestions} />
        </div>
      )}
    </main>
  );
}
