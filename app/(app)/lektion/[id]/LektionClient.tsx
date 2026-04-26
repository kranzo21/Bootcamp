// app/(app)/lektion/[id]/LektionClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lektion, QuizQuestion, Badge } from "@/types";
import { toYouTubeEmbedUrl } from "@/lib/youtube";
import H5PPlayer from "@/components/ui/H5PPlayer";

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
  const [currentQuestion, setCurrentQuestion] = useState(0);
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
      <button
        onClick={() => window.history.back()}
        className="text-[9px] uppercase tracking-[2px] text-gray-mid hover:text-teal transition-colors mb-4 block"
      >
        ← Zurück
      </button>

      <h1 className="text-2xl font-bold tracking-tight text-ink mb-1">
        {lektion.title}
      </h1>
      {lektion.description && (
        <p className="text-sm text-gray-mid mb-6">{lektion.description}</p>
      )}

      {/* Passed banner */}
      {passed && (
        <div className="bg-white border border-teal/30 rounded-xl p-5 mb-6 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">🎉</span>
          <p className="font-bold text-teal text-base">Prüfung bestanden!</p>
          {badge && (
            <div className="mt-1 flex flex-col items-center gap-1">
              <span className="text-4xl">{badge.icon}</span>
              <p className="text-sm font-semibold text-ink">{badge.name}</p>
              {badge.description && (
                <p className="text-xs text-gray-mid">{badge.description}</p>
              )}
            </div>
          )}
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

      {/* H5P Interaktiver Inhalt */}
      {lektion.h5p_content_path && (
        <div className="mb-8">
          <H5PPlayer contentPath={lektion.h5p_content_path} />
        </div>
      )}

      {/* Prüfung */}
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
              onClick={() => {
                setShowQuiz(true);
                setCurrentQuestion(0);
              }}
              disabled={Boolean(isLocked)}
              className="w-full bg-teal text-teal-light font-bold text-xs uppercase tracking-[1.5px] rounded-lg py-3 hover:bg-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prüfung absolvieren
            </button>
          ) : quizResult ? (
            <div
              className={`border rounded-xl p-6 text-center ${
                quizResult.passed
                  ? "border-teal/30 bg-white"
                  : "border-red-200 bg-red-50"
              }`}
            >
              {quizResult.passed ? (
                <>
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="font-bold text-teal text-base mb-1">
                    Bestanden!
                  </p>
                  <p className="text-sm text-gray-mid">
                    {Math.round(quizResult.score * 100)}% richtig
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl mb-2">✗</p>
                  <p className="font-bold text-red-700 text-base mb-1">
                    Nicht bestanden
                  </p>
                  <p className="text-sm text-gray-mid">
                    {Math.round(quizResult.score * 100)}% richtig — versuche es
                    morgen erneut.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Fortschritt */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-border rounded-full">
                  <div
                    className="h-1.5 bg-teal rounded-full transition-all"
                    style={{
                      width: `${(currentQuestion / questions.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-mid flex-shrink-0">
                  {currentQuestion + 1} / {questions.length}
                </span>
              </div>

              {/* Aktuelle Frage */}
              <div className="bg-white border border-border rounded-xl p-5">
                <p className="text-sm font-semibold text-ink mb-4">
                  {questions[currentQuestion].question}
                </p>
                <div className="flex flex-col gap-2">
                  {questions[currentQuestion].options.map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => {
                        const next = [...quizAnswers];
                        next[currentQuestion] = oi;
                        setQuizAnswers(next);
                      }}
                      className={`text-left text-sm px-4 py-3 rounded-lg border transition-all ${
                        quizAnswers[currentQuestion] === oi
                          ? "border-teal bg-teal/5 text-teal font-semibold"
                          : "border-border text-gray-mid hover:border-teal/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion((q) => q + 1)}
                  disabled={quizAnswers[currentQuestion] === null}
                  className="w-full bg-teal text-teal-light font-bold text-xs uppercase tracking-[1.5px] rounded-lg py-3 hover:bg-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Weiter →
                </button>
              ) : (
                <button
                  onClick={submitQuiz}
                  disabled={loading || quizAnswers[currentQuestion] === null}
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
