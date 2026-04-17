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
      className="w-full aspect-video rounded-xl mb-6"
      allowFullScreen
      title={lektion.title}
    />
  ) : null;

  return (
    <div>
      {/* Back link */}
      <Link
        href="javascript:history.back()"
        className="text-[9px] uppercase tracking-[2px] text-gray-mid hover:text-teal transition-colors mb-4 block"
      >
        ← Zurück
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">
        {lektion.title}
      </h1>
      {lektion.description && (
        <p className="text-sm text-gray-mid mb-6">{lektion.description}</p>
      )}

      {/* Passed banner */}
      {passed && (
        <div className="bg-white border border-teal/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-teal text-xl">✓</span>
          <p className="text-sm font-medium text-teal">
            Lektion abgeschlossen
            {badge ? ` — ${badge.icon} ${badge.name} verdient!` : ""}
          </p>
        </div>
      )}

      {/* Video oben */}
      {lektion.video_position !== "below" && videoBlock}

      {/* Text-Content */}
      {lektion.content && (
        <div
          className="prose prose-sm max-w-none mb-8 text-ink/70"
          dangerouslySetInnerHTML={{ __html: lektion.content }}
        />
      )}

      {/* Video unten */}
      {lektion.video_position === "below" && videoBlock}

      {/* Quiz */}
      {questions.length > 0 && !passed && (
        <section className="mt-6">
          {isLocked && (
            <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-4">
              Nächster Versuch möglich ab{" "}
              {new Date(lockedUntil!).toLocaleString("de-DE")}.
            </p>
          )}

          {!showQuiz ? (
            <button
              onClick={() => setShowQuiz(true)}
              disabled={Boolean(isLocked)}
              className="w-full bg-teal text-teal-light font-bold text-xs uppercase tracking-[1.5px] rounded-lg py-3 hover:bg-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Quiz starten
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              {questions.map((q, qi) => (
                <div
                  key={q.id}
                  className="bg-white border border-border rounded-xl p-4"
                >
                  <p className="text-sm font-semibold text-ink mb-3">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => {
                          const next = [...quizAnswers];
                          next[qi] = oi;
                          setQuizAnswers(next);
                        }}
                        className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-all ${
                          quizAnswers[qi] === oi
                            ? "border-teal bg-teal/5 text-teal font-semibold"
                            : "border-border text-gray-mid hover:border-teal/50"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {quizResult ? (
                <div
                  className={`border rounded-xl p-4 ${
                    quizResult.passed
                      ? "border-teal/30 bg-white"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <p
                    className={`font-bold text-sm ${
                      quizResult.passed ? "text-teal" : "text-red-700"
                    }`}
                  >
                    {quizResult.passed
                      ? `✓ Bestanden! ${Math.round(quizResult.score * 100)}% richtig`
                      : `✗ Nicht bestanden (${Math.round(quizResult.score * 100)}%). Versuche es morgen erneut.`}
                  </p>
                </div>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={loading || quizAnswers.some((a) => a === null)}
                  className="w-full bg-teal text-teal-light font-bold text-xs uppercase tracking-[1.5px] rounded-lg py-3 hover:bg-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Auswerten…" : "Abgeben →"}
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
