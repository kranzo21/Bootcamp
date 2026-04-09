"use client";

import { useState } from "react";
import type { Module, Track } from "@/types";

interface Props {
  module: Module;
  track: Track;
  onComplete: () => void;
}

export default function Quiz({ module, track, onComplete }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(module.fragen.length).fill(null),
  );
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  function selectAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  async function handleSubmit() {
    if (answers.some((a) => a === null)) return;
    setLoading(true);
    setFetchError(null);

    try {
      const correctAnswers = module.fragen.map((f) => f.richtig);
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: module.id,
          track,
          correctAnswers,
          givenAnswers: answers,
        }),
      });

      if (!res.ok) {
        setFetchError("Fehler beim Auswerten. Bitte versuche es erneut.");
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setFetchError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4 text-center py-8">
        <p className="text-5xl">{result.passed ? "🎉" : "😔"}</p>
        <p className="text-2xl font-bold">
          {Math.round(result.score * 100)}% richtig
        </p>
        {result.passed ? (
          <>
            <p className="text-green-600 font-medium">
              Bestanden! Modul abgeschlossen.
            </p>
            <button
              onClick={onComplete}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 mx-auto"
            >
              Zum Dashboard
            </button>
          </>
        ) : (
          <>
            <p className="text-red-600">
              Nicht bestanden (mind. 80% erforderlich). Bitte morgen erneut
              versuchen.
            </p>
            <button
              onClick={onComplete}
              className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 mx-auto"
            >
              Zurück zum Dashboard
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h2 className="text-xl font-bold">Test: {module.titel}</h2>
      <p className="text-sm text-gray-600">
        Mindestens 80% richtig zum Bestehen.
      </p>

      {module.fragen.map((frage, qi) => (
        <div key={qi} className="flex flex-col gap-3">
          <p className="font-medium">
            {qi + 1}. {frage.frage}
          </p>
          {frage.optionen.map((option, oi) => (
            <label
              key={oi}
              className={`flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                answers[qi] === oi ? "border-blue-500 bg-blue-50" : ""
              }`}
            >
              <input
                type="radio"
                name={`frage-${qi}`}
                checked={answers[qi] === oi}
                onChange={() => selectAnswer(qi, oi)}
                className="w-4 h-4"
              />
              {option}
            </label>
          ))}
        </div>
      ))}

      {fetchError && <p className="text-red-600 text-sm">{fetchError}</p>}

      <button
        onClick={handleSubmit}
        disabled={answers.some((a) => a === null) || loading}
        className="bg-green-600 text-white py-3 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Auswerten..." : "Test abgeben"}
      </button>
    </div>
  );
}
