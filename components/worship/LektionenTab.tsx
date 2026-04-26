"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lektion, Module } from "@/types";

interface Props {
  lektionen: Lektion[];
  modules: Module[];
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

function ModulSection({
  modul,
  lektionen,
  passedIds,
  isAdmin,
}: {
  modul: Module;
  lektionen: Lektion[];
  passedIds: Set<string>;
  isAdmin: boolean;
}) {
  const passedCount = lektionen.filter((l) => passedIds.has(l.id)).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-ink">{modul.name}</h2>
          {modul.description && (
            <p className="text-xs text-gray-mid mt-0.5">{modul.description}</p>
          )}
        </div>
        <span className="text-xs text-gray-mid flex-shrink-0 ml-4">
          {passedCount}/{lektionen.length}
        </span>
      </div>
      {lektionen.map((l) => (
        <LektionCard
          key={l.id}
          l={l}
          passed={passedIds.has(l.id)}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}

export default function LektionenTab({
  lektionen,
  modules,
  passedIds,
  isAdmin,
  areaId,
}: Props) {
  const passedSet = new Set(passedIds);
  const hasModules = modules.length > 0;

  const grouped = hasModules
    ? modules.map((m) => ({
        modul: m,
        lektionen: lektionen.filter((l) => l.module_id === m.id),
      }))
    : [];

  const ungrouped = lektionen.filter(
    (l) => !hasModules || l.module_id === null,
  );

  return (
    <div className="flex flex-col gap-10">
      {grouped.map(({ modul, lektionen: ml }) => (
        <ModulSection
          key={modul.id}
          modul={modul}
          lektionen={ml}
          passedIds={passedSet}
          isAdmin={isAdmin}
        />
      ))}

      {ungrouped.length > 0 && (
        <div className="flex flex-col gap-3">
          {ungrouped.map((l) => (
            <LektionCard
              key={l.id}
              l={l}
              passed={passedSet.has(l.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

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
