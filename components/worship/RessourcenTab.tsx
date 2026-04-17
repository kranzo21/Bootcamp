"use client";
import { useState, useMemo } from "react";
import type { Ressource } from "@/types";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

interface Props {
  ressourcen: Ressource[];
}

function RessourceCard({ r }: { r: Ressource }) {
  const [open, setOpen] = useState(false);
  const embedUrl = r.type === "youtube" ? toYouTubeEmbedUrl(r.url) : null;

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <span className="font-semibold text-ink text-sm">{r.title}</span>
          {r.instrument && (
            <span className="ml-2 text-xs text-gray-mid">({r.instrument})</span>
          )}
        </div>
        <span
          className={`text-gray-mid transition-transform duration-200 flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          {r.description && (
            <p className="text-sm text-gray-mid mb-3">{r.description}</p>
          )}
          {r.type === "youtube" && embedUrl && (
            <iframe
              src={embedUrl}
              className="w-full aspect-video rounded-lg"
              allowFullScreen
              title={r.title}
            />
          )}
          {r.type === "pdf" && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-teal border border-teal px-3 py-1.5 rounded-lg hover:bg-teal/5 transition-colors"
            >
              📄 PDF öffnen
            </a>
          )}
          {r.type === "audio" && (
            <audio controls className="w-full">
              <source src={r.url} />
            </audio>
          )}
          {r.type === "image" && (
            <img
              src={r.url}
              alt={r.title}
              className="w-full rounded-lg max-h-64 object-contain"
            />
          )}
        </div>
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
