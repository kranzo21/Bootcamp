"use client";
import { useState } from "react";
import Link from "next/link";
import H5PPlayer from "@/components/ui/H5PPlayer";

const H5P_EXAM_PATH = "/h5p-content/gewächshaus-pruefung";

export default function PruefungClient() {
  const [done, setDone] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm px-5 pt-5 pb-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/bereich/gewaechshaus"
              className="text-[10px] uppercase tracking-[2px] text-gray-mid hover:text-teal transition-colors"
            >
              ← Übersicht
            </Link>
            <span className="text-[10px] uppercase tracking-[2px] text-gray-mid">
              Abschlussprüfung
            </span>
          </div>
          <div className="h-1 bg-teal rounded-full" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 py-8">
        {done ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
            <div className="text-6xl">🎉</div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              Gewächshaus abgeschlossen!
            </h1>
            <p className="text-gray-mid text-sm max-w-sm">
              Du hast alle Lektionen und die Abschlussprüfung erfolgreich
              abgeschlossen. Willkommen im Worship Team.
            </p>
            <Link
              href="/dashboard"
              className="bg-teal text-white font-bold text-xs uppercase tracking-[2px] px-8 py-4 rounded-2xl hover:bg-teal/90 transition-colors"
            >
              Zum Dashboard →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-[10px] uppercase tracking-[3px] text-gray-mid mb-2">
              Gewächshaus
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">
              Abschlussprüfung
            </h1>
            <H5PPlayer
              contentPath={H5P_EXAM_PATH}
              onComplete={() => setDone(true)}
            />
          </>
        )}
      </div>
    </div>
  );
}
