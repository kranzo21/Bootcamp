"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "@/components/module/VideoPlayer";
import TextContent from "@/components/module/TextContent";
import Quiz from "@/components/module/Quiz";
import { isCooledDown } from "@/lib/progress/utils";
import type { Module, Track } from "@/types";

interface Props {
  module: Module;
  track: Track;
  userId: string;
  viewedIds: string[];
  materialsCompleted: boolean;
  alreadyPassed: boolean;
  lastAttemptAt: string | null;
}

export default function ModuleClient({
  module,
  track,
  userId,
  viewedIds: initialViewedIds,
  materialsCompleted: initialMaterialsCompleted,
  alreadyPassed,
  lastAttemptAt,
}: Props) {
  const router = useRouter();
  const [viewedIds, setViewedIds] = useState<string[]>(initialViewedIds);
  const [materialsCompleted, setMaterialsCompleted] = useState(
    initialMaterialsCompleted,
  );
  const [showQuiz, setShowQuiz] = useState(false);

  const allMaterialIds = useMemo(
    () => [
      ...module.videos.map((_, i) => `video-${i}`),
      ...module.texte.map((_, i) => `text-${i}`),
    ],
    [module.videos, module.texte],
  );

  const handleViewed = useCallback(
    async (materialId: string) => {
      if (viewedIds.includes(materialId)) return;

      const newViewed = [...viewedIds, materialId];
      setViewedIds(newViewed);

      const supabase = createClient();
      await supabase.from("material_views").upsert({
        user_id: userId,
        module_id: module.id,
        material_id: materialId,
      });

      if (
        allMaterialIds.every((id) => newViewed.includes(id)) &&
        !materialsCompleted
      ) {
        setMaterialsCompleted(true);
        await supabase.from("progress").upsert({
          user_id: userId,
          module_id: module.id,
          track,
          materials_completed: true,
        });
      }
    },
    [viewedIds, materialsCompleted, module.id, track, userId, allMaterialIds],
  );

  const canStartQuiz =
    materialsCompleted && !alreadyPassed && isCooledDown(lastAttemptAt);
  const onCooldown =
    materialsCompleted && !alreadyPassed && !isCooledDown(lastAttemptAt);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <a
        href="/dashboard"
        className="text-blue-600 text-sm hover:underline mb-4 block"
      >
        ← Zurück zum Dashboard
      </a>

      <h1 className="text-2xl font-bold mb-6">{module.titel}</h1>

      {!showQuiz && (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Videos</h2>
            <div className="flex flex-col gap-6">
              {module.videos.map((video, i) => (
                <VideoPlayer
                  key={i}
                  video={video}
                  materialId={`video-${i}`}
                  onViewed={handleViewed}
                />
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Texte</h2>
            <div className="flex flex-col gap-4">
              {module.texte.map((text, i) => (
                <TextContent
                  key={i}
                  text={text}
                  materialId={`text-${i}`}
                  onViewed={handleViewed}
                />
              ))}
            </div>
          </section>

          <div className="mt-8 border-t pt-6">
            {alreadyPassed && (
              <p className="text-green-600 font-medium">
                Dieses Modul ist abgeschlossen.
              </p>
            )}
            {onCooldown && (
              <p className="text-orange-600 text-sm">
                Test nicht bestanden. Bitte morgen erneut versuchen (24h
                Wartezeit).
              </p>
            )}
            {canStartQuiz && (
              <button
                onClick={() => setShowQuiz(true)}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700"
              >
                Test starten
              </button>
            )}
            {!materialsCompleted && (
              <p className="text-gray-500 text-sm">
                Schaue alle Videos und lese alle Texte, um den Test
                freizuschalten.
              </p>
            )}
          </div>
        </>
      )}

      {showQuiz && (
        <Quiz
          module={module}
          track={track}
          onComplete={() => router.push("/dashboard")}
        />
      )}
    </main>
  );
}
