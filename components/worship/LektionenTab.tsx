"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lektion } from "@/types";

interface Props {
  lektionen: Lektion[];
  passedIds: string[];
  isAdmin: boolean;
  areaId: string;
}

function LektionCard({
  l,
  passed,
  isAdmin,
}: {
  l: Lektion;
  passed: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {passed && (
            <span className="text-teal text-base flex-shrink-0">✓</span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-ink text-sm">{l.title}</p>
            {l.description && (
              <p className="text-xs text-gray-mid truncate">{l.description}</p>
            )}
          </div>
        </div>
        <span
          className={`text-gray-mid transition-transform duration-200 flex-shrink-0 ml-3 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-5 pt-4">
          {l.content && (
            <div
              className="prose prose-sm max-w-none text-ink/80 mb-5"
              dangerouslySetInnerHTML={{ __html: l.content }}
            />
          )}
          <div className="flex items-center gap-3">
            <Link
              href={`/lektion/${l.id}`}
              className="bg-teal text-white text-xs font-bold uppercase tracking-[1.5px] px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              {passed ? "Erneut ansehen" : "Prüfung absolvieren"}
            </Link>
            {isAdmin && (
              <Link
                href={`/admin/inhalte/bearbeiten?type=lektion&id=${l.id}`}
                className="text-xs text-gray-mid hover:text-teal transition-colors"
              >
                ✏️ Bearbeiten
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LektionenTab({
  lektionen,
  passedIds,
  isAdmin,
  areaId,
}: Props) {
  const passedSet = new Set(passedIds);

  return (
    <div className="flex flex-col gap-3">
      {lektionen.length === 0 && (
        <p className="text-gray-mid text-sm">Noch keine Lektionen vorhanden.</p>
      )}
      {lektionen.map((l) => (
        <LektionCard
          key={l.id}
          l={l}
          passed={passedSet.has(l.id)}
          isAdmin={isAdmin}
        />
      ))}
      {isAdmin && (
        <Link
          href={`/admin/inhalte/neu?type=lektion&areaId=${areaId}`}
          className="border border-dashed border-border rounded-xl p-4 text-center text-sm text-gray-mid hover:text-teal hover:border-teal transition-colors"
        >
          + Neue Lektion
        </Link>
      )}
    </div>
  );
}
