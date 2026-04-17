// app/(app)/instrument/[slug]/InstrumentClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Area, Tutorial, Ressource } from "@/types";

interface Props {
  area: Area;
  programSlug: string;
  programName: string;
  tutorials: Tutorial[];
  ressourcen: Ressource[];
  initialFavIds: string[];
}

export default function InstrumentClient({
  area,
  programSlug,
  programName,
  tutorials,
  ressourcen,
  initialFavIds,
}: Props) {
  const [tab, setTab] = useState<"tutorials" | "ressourcen">("tutorials");
  const [favIds, setFavIds] = useState<Set<string>>(new Set(initialFavIds));
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleFav(itemType: "tutorial" | "ressource", itemId: string) {
    setLoading(itemId);
    const isFav = favIds.has(itemId);
    const method = isFav ? "DELETE" : "POST";
    await fetch("/api/favourites", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, itemId }),
    });
    const next = new Set(favIds);
    isFav ? next.delete(itemId) : next.add(itemId);
    setFavIds(next);
    setLoading(null);
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link
        href={`/programm/${programSlug}`}
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← {programName}
      </Link>
      <h1 className="text-3xl font-bold mb-6">{area.name}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(["tutorials", "ressourcen"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 -mb-px border-b-2 transition capitalize ${
              tab === t
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-500"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tutorials */}
      {tab === "tutorials" && (
        <div className="flex flex-col gap-3">
          {tutorials.length === 0 && (
            <p className="text-gray-500">Noch keine Tutorials vorhanden.</p>
          )}
          {tutorials.map((t) => (
            <div
              key={t.id}
              className="border rounded-lg p-4 flex items-center justify-between"
            >
              <Link href={`/tutorial/${t.id}`} className="flex-1">
                <h3 className="font-semibold hover:text-blue-600">{t.title}</h3>
                <p className="text-sm text-gray-500">{t.description}</p>
              </Link>
              <button
                onClick={() => toggleFav("tutorial", t.id)}
                disabled={loading === t.id}
                className={`ml-3 text-2xl transition ${favIds.has(t.id) ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
              >
                ★
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ressourcen */}
      {tab === "ressourcen" && (
        <div className="flex flex-col gap-3">
          {ressourcen.length === 0 && (
            <p className="text-gray-500">Noch keine Ressourcen vorhanden.</p>
          )}
          {ressourcen.map((r) => (
            <div
              key={r.id}
              className="border rounded-lg p-4 flex items-center justify-between"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-3"
              >
                <span className="text-xl">
                  {r.type === "pdf"
                    ? "📄"
                    : r.type === "audio"
                      ? "🎵"
                      : r.type === "image"
                        ? "🖼️"
                        : "🔗"}
                </span>
                <div>
                  <h3 className="font-semibold hover:text-blue-600">
                    {r.title}
                  </h3>
                  <p className="text-sm text-gray-500">{r.description}</p>
                </div>
              </a>
              <button
                onClick={() => toggleFav("ressource", r.id)}
                disabled={loading === r.id}
                className={`ml-3 text-2xl transition ${favIds.has(r.id) ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
              >
                ★
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
