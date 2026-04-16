"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import type { Tutorial } from "@/types";
import { getYouTubeThumbnail } from "@/lib/youtube";

interface Props {
  tutorials: Tutorial[];
}

export default function TutorialsTab({ tutorials }: Props) {
  const [search, setSearch] = useState("");
  const [instrument, setInstrument] = useState("");

  const instruments = useMemo(() => {
    const set = new Set(
      tutorials.map((t) => t.instrument).filter(Boolean) as string[],
    );
    return Array.from(set).sort();
  }, [tutorials]);

  const filtered = useMemo(() => {
    return tutorials.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchInstrument = !instrument || t.instrument === instrument;
      return matchSearch && matchInstrument;
    });
  }, [tutorials, search, instrument]);

  return (
    <div>
      {/* Suche + Filter */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Tutorial suchen..."
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
        <p className="text-gray-500 text-sm">Keine Tutorials gefunden.</p>
      )}

      {/* Kachelraster */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((t) => {
          const thumb = getYouTubeThumbnail(t.video_url);
          return (
            <Link
              key={t.id}
              href={`/tutorial/${t.id}`}
              className="border rounded-lg overflow-hidden hover:shadow transition"
            >
              {thumb && (
                <img
                  src={thumb}
                  alt={t.title}
                  className="w-full aspect-video object-cover"
                />
              )}
              <div className="p-3">
                <h3 className="font-semibold text-sm">{t.title}</h3>
                {t.instrument && (
                  <span className="text-xs text-blue-600 mt-1 block">
                    {t.instrument}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
