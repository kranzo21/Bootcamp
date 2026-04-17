"use client";
import { useState, useMemo } from "react";
import type { Ressource } from "@/types";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

interface Props {
  ressourcen: Ressource[];
}

function RessourceCard({ r }: { r: Ressource }) {
  const embedUrl = r.type === "youtube" ? toYouTubeEmbedUrl(r.url) : null;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{r.title}</h3>
          {r.instrument && (
            <span className="text-xs text-blue-600">{r.instrument}</span>
          )}
        </div>
        {r.type !== "youtube" && (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
          >
            Download
          </a>
        )}
      </div>

      {r.type === "pdf" && (
        <iframe
          src={r.url}
          className="w-full h-64 rounded border"
          title={r.title}
        />
      )}

      {r.type === "audio" && (
        <audio controls className="w-full mt-2">
          <source src={r.url} />
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm"
          >
            Audio öffnen
          </a>
        </audio>
      )}

      {r.type === "image" && (
        <img
          src={r.url}
          alt={r.title}
          className="w-full rounded mt-2 max-h-64 object-contain"
        />
      )}

      {r.type === "youtube" && embedUrl && (
        <iframe
          src={embedUrl}
          className="w-full aspect-video rounded mt-2"
          allowFullScreen
          title={r.title}
        />
      )}
    </div>
  );
}

export default function RessourcenTab({ ressourcen }: Props) {
  const [search, setSearch] = useState("");
  const [instrument, setInstrument] = useState("");

  const instruments = useMemo(() => {
    const set = new Set(
      ressourcen.map((r) => r.instrument).filter(Boolean) as string[],
    );
    return Array.from(set).sort();
  }, [ressourcen]);

  const filtered = useMemo(() => {
    return ressourcen.filter((r) => {
      const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
      const matchInstrument = !instrument || r.instrument === instrument;
      return matchSearch && matchInstrument;
    });
  }, [ressourcen, search, instrument]);

  return (
    <div>
      {/* Suche + Filter */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Ressource suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 text-sm"
        />
        {instruments.length > 0 && (
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Alle Instrumente</option>
            {instruments.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-sm">Keine Ressourcen gefunden.</p>
      )}

      <div className="flex flex-col gap-4">
        {filtered.map((r) => (
          <RessourceCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
