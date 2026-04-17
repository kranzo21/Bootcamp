// components/admin/QuizEditor.tsx
"use client";
import { useState } from "react";
import type { QuizQuestion } from "@/types";

interface Props {
  lektionId: string;
  initialQuestions: QuizQuestion[];
}

interface DraftQuestion {
  id?: string;
  question: string;
  options: string[];
  correctIndex: number;
}

function emptyQuestion(): DraftQuestion {
  return { question: "", options: ["", ""], correctIndex: 0 };
}

export default function QuizEditor({ lektionId, initialQuestions }: Props) {
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    initialQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      options: [...q.options],
      correctIndex: q.correct_index,
    })),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateQuestion(idx: number, field: Partial<DraftQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...field } : q)),
    );
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[oIdx] = value;
        return { ...q, options };
      }),
    );
  }

  function addOption(qIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.filter((_, j) => j !== oIdx);
        const correctIndex =
          q.correctIndex >= options.length ? 0 : q.correctIndex;
        return { ...q, options, correctIndex };
      }),
    );
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.id) {
        await fetch("/api/admin/quiz-questions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: q.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
          }),
        });
      } else {
        const res = await fetch("/api/admin/quiz-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lektionId,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            order: i,
          }),
        });
        const data = await res.json();
        setQuestions((prev) =>
          prev.map((pq, pi) => (pi === i ? { ...pq, id: data.id } : pq)),
        );
      }
    }

    // Gelöschte Fragen entfernen
    for (const orig of initialQuestions) {
      if (!questions.find((q) => q.id === orig.id)) {
        await fetch("/api/admin/quiz-questions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: orig.id }),
        });
      }
    }

    setSaving(false);
    setMessage("Quiz gespeichert.");
  }

  return (
    <div className="mt-8 border-t pt-6">
      <h2 className="text-lg font-semibold mb-4">Quiz-Fragen</h2>

      {questions.map((q, qi) => (
        <div key={qi} className="border rounded-lg p-4 mb-4 bg-gray-50">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-sm">Frage {qi + 1}</span>
            <button
              onClick={() => removeQuestion(qi)}
              className="text-red-500 text-xs hover:underline"
            >
              Löschen
            </button>
          </div>

          <input
            value={q.question}
            onChange={(e) => updateQuestion(qi, { question: e.target.value })}
            placeholder="Fragetext..."
            className="border rounded px-3 py-2 w-full text-sm mb-3"
          />

          <p className="text-xs text-gray-500 mb-2">Antworten (● = richtig)</p>
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2 mb-2">
              <input
                type="radio"
                name={`correct-${qi}`}
                checked={q.correctIndex === oi}
                onChange={() => updateQuestion(qi, { correctIndex: oi })}
              />
              <input
                value={opt}
                onChange={(e) => updateOption(qi, oi, e.target.value)}
                placeholder={`Antwort ${oi + 1}`}
                className="border rounded px-2 py-1 text-sm flex-1"
              />
              {q.options.length > 2 && (
                <button
                  onClick={() => removeOption(qi, oi)}
                  className="text-red-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {q.options.length < 4 && (
            <button
              onClick={() => addOption(qi)}
              className="text-blue-600 text-xs hover:underline"
            >
              + Antwort hinzufügen
            </button>
          )}
        </div>
      ))}

      <button
        onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
        className="text-blue-600 text-sm hover:underline mb-4 block"
      >
        + Frage hinzufügen
      </button>

      <button
        onClick={saveAll}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {saving ? "Speichern..." : "Quiz speichern"}
      </button>
      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
    </div>
  );
}
