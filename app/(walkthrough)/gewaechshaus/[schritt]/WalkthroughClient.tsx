"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import H5PPlayer from "@/components/ui/H5PPlayer";
import type { Lektion } from "@/types";

interface Props {
  lektion: Lektion;
  moduleName: string;
  schritt: number;
  totalSchritte: number;
  nextHref: string;
  alreadyCompleted: boolean;
}

export default function WalkthroughClient({
  lektion,
  moduleName,
  schritt,
  totalSchritte,
  nextHref,
  alreadyCompleted,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [h5pDone, setH5pDone] = useState(false);

  const hasH5P = Boolean(lektion.h5p_content_path);
  const canComplete = alreadyCompleted || !hasH5P || h5pDone;
  const progress = Math.round(((schritt - 1) / totalSchritte) * 100);
  const embedUrl = lektion.video_url
    ? toYouTubeEmbedUrl(lektion.video_url)
    : null;

  async function complete() {
    if (!canComplete || isPending) return;
    if (!alreadyCompleted) {
      await fetch("/api/lektion-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lektionId: lektion.id }),
      });
    }
    startTransition(() => router.push(nextHref));
  }

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
              Schritt {schritt} von {totalSchritte}
            </span>
          </div>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-1 bg-teal rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-5 py-8">
        <p className="text-[10px] uppercase tracking-[3px] text-gray-mid mb-2">
          {moduleName}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mb-8">
          {lektion.title}
        </h1>

        {lektion.video_position !== "below" && embedUrl && (
          <iframe
            src={embedUrl}
            className="w-full aspect-video rounded-2xl mb-8"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={lektion.title}
          />
        )}

        {lektion.content && (
          <div
            className="prose prose-sm max-w-none text-ink/80 mb-8"
            dangerouslySetInnerHTML={{ __html: lektion.content }}
          />
        )}

        {lektion.video_position === "below" && embedUrl && (
          <iframe
            src={embedUrl}
            className="w-full aspect-video rounded-2xl mb-8"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={lektion.title}
          />
        )}

        {lektion.h5p_content_path && (
          <div className="mb-8">
            <H5PPlayer
              contentPath={lektion.h5p_content_path}
              onComplete={() => setH5pDone(true)}
            />
            {!h5pDone && !alreadyCompleted && (
              <p className="text-xs text-gray-mid text-center mt-3">
                Schließe die interaktive Aufgabe ab um weiterzumachen.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-cream/95 backdrop-blur-sm border-t border-border px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={complete}
            disabled={!canComplete || isPending}
            className={`w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-[2px] transition-all duration-300 ${
              canComplete
                ? "bg-teal text-white hover:bg-teal/90"
                : "bg-border text-gray-mid cursor-not-allowed"
            }`}
          >
            {isPending ? "Weiter…" : "Lektion abschließen →"}
          </button>
        </div>
      </div>
    </div>
  );
}
