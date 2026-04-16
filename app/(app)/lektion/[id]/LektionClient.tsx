// app/(app)/lektion/[id]/LektionClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lektion, QuizQuestion, Badge } from "@/types";
import { toYouTubeEmbedUrl } from "@/lib/youtube";

interface Props {
  lektion: Lektion;
  questions: QuizQuestion[];
  badge: Badge | null;
  passed: boolean;
  lockedUntil: string | null;
}

export default function LektionClient({
  lektion,
  questions,
  badge,
  passed,
  lockedUntil,
}: Props) {
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>(
    questions.map(() => null),
  );
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);

  const embedUrl = lektion.video_url
    ? toYouTubeEmbedUrl(lektion.video_url)
    : null;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  async function submitQuiz() {
    if (quizAnswers.some((a) => a === null)) {
      alert("Bitte beantworte alle Fragen.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lektionId: lektion.id,
        correctAnswers: questions.map((q) => q.correct_index),
        givenAnswers: quizAnswers,
      }),
    });
    const result = await res.json();
    setQuizResult(result);
    setLoading(false);
  }

  const videoBlock = embedUrl ? (
    <iframe
      src={embedUrl}
      className="w-full aspect-video rounded-lg mb-8"
      allowFullScreen
      title={lektion.title}
    />
  ) : null;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Link
        href="javascript:history.back()"
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Zurück
      </Link>
      <h1 className="text-3xl font-bold mb-2">{lektion.title}</h1>
      {lektion.description && (
        <p className="text-gray-600 mb-6">{lektion.description}</p>
      )}

      {passed && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700 font-medium">
            ✓ Lektion abgeschlossen
            {badge
              ? ` — Abzeichen „${badge.icon} ${badge.name}" verdient!`
              : ""}
          </p>
        </div>
      )}

      {/* Video oben */}
      {lektion.video_position !== "below" && videoBlock}

      {/* Text-Content */}
      {lektion.content && (
        <div
          className="prose prose-sm max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: lektion.content }}
        />
      )}

      {/* Video unten */}
      {lektion.video_position === "below" && videoBlock}

      {/* Quiz */}
      {questions.length > 0 && !passed && (
        <section className="mt-8">
          {isLocked && (
            <p className="text-orange-600 text-sm mb-4">
              Nächster Versuch möglich ab{" "}
              {new Date(lockedUntil!).toLocaleString("de-DE")}.
            </p>
          )}
          {!showQuiz ? (
            <button
              onClick={() => setShowQuiz(true)}
              disabled={Boolean(isLocked)}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test starten
            </button>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4">Test</h2>
              {questions.map((q, qi) => (
                <div key={q.id} className="mb-6">
                  <p className="font-medium mb-2">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`q-${qi}`}
                          checked={quizAnswers[qi] === oi}
                          onChange={() => {
                            const next = [...quizAnswers];
                            next[qi] = oi;
                            setQuizAnswers(next);
                          }}
                          className="w-4 h-4"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {quizResult ? (
                <div
                  className={`rounded-lg p-4 border ${
                    quizResult.passed
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <p className="font-semibold">
                    {quizResult.passed ? "✓ Bestanden!" : "✗ Nicht bestanden."}
                  </p>
                  <p className="text-sm mt-1">
                    Ergebnis: {Math.round(quizResult.score * 100)}%
                    {!quizResult.passed && " — Nächster Versuch in 24 Stunden."}
                  </p>
                </div>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Auswerten..." : "Abgeben"}
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
