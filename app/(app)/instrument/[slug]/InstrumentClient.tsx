// app/(app)/instrument/[slug]/InstrumentClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Area, Tutorial, Ressource } from "@/types";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import FavouriteButton from "@/components/ui/FavouriteButton";

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

  return (
    <div>
      <Link
        href={`/programm/${programSlug}`}
        className="text-sm text-teal hover:underline mb-4 block"
      >
        ← {programName}
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink mb-6">
        {area.name}
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {(["tutorials", "ressourcen"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 -mb-px border-b-2 transition text-sm font-medium ${
              tab === t
                ? "border-teal text-teal"
                : "border-transparent text-gray-mid hover:text-ink"
            }`}
          >
            {t === "tutorials" ? "Tutorials" : "Ressourcen"}
          </button>
        ))}
      </div>

      {/* Tutorials */}
      {tab === "tutorials" && (
        <div className="flex flex-col gap-3">
          {tutorials.length === 0 && (
            <p className="text-gray-mid text-sm">
              Noch keine Tutorials vorhanden.
            </p>
          )}
          {tutorials.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-border rounded-xl p-4 flex items-center justify-between"
            >
              <Link href={`/tutorial/${t.id}`} className="flex-1">
                <h3 className="font-semibold text-ink hover:text-teal transition-colors">
                  {t.title}
                </h3>
                {t.description && (
                  <p className="text-sm text-gray-mid">{t.description}</p>
                )}
              </Link>
              <FavouriteButton
                itemType="tutorial"
                itemId={t.id}
                initialFav={initialFavIds.includes(t.id)}
                className="ml-3"
              />
            </div>
          ))}
        </div>
      )}

      {/* Ressourcen */}
      {tab === "ressourcen" && (
        <div className="flex flex-col gap-4">
          {ressourcen.length === 0 && (
            <p className="text-gray-mid text-sm">
              Noch keine Ressourcen vorhanden.
            </p>
          )}
          {ressourcen.map((r) => {
            const embedUrl =
              r.type === "youtube" ? toYouTubeEmbedUrl(r.url) : null;

            return (
              <div
                key={r.id}
                className="bg-white border border-border rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-ink">{r.title}</h3>
                    {r.description && (
                      <p className="text-sm text-gray-mid">{r.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    {r.type !== "youtube" && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal border border-teal px-3 py-1 rounded-lg hover:bg-teal/5 transition-colors"
                      >
                        {r.type === "pdf"
                          ? "📄 Download"
                          : r.type === "audio"
                            ? "🎵 Öffnen"
                            : "🖼️ Ansehen"}
                      </a>
                    )}
                    <FavouriteButton
                      itemType="ressource"
                      itemId={r.id}
                      initialFav={initialFavIds.includes(r.id)}
                    />
                  </div>
                </div>

                {r.type === "youtube" && embedUrl && (
                  <iframe
                    src={embedUrl}
                    className="w-full aspect-video rounded-lg"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={r.title}
                  />
                )}
                {r.type === "pdf" && (
                  <iframe
                    src={r.url}
                    className="w-full h-64 rounded-lg border border-border"
                    title={r.title}
                  />
                )}
                {r.type === "audio" && (
                  <audio controls className="w-full mt-2">
                    <source src={r.url} />
                  </audio>
                )}
                {r.type === "image" && (
                  <img
                    src={r.url}
                    alt={r.title}
                    className="w-full rounded-lg mt-2 max-h-64 object-contain"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
