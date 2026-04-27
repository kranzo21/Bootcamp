"use client";

import Image from "next/image";
import { useState, useRef, useCallback } from "react";

type Decision = "angemessen" | "unangemessen";

interface Card {
  id: number;
  image: string;
  correct: Decision;
}

const CARDS: Card[] = [
  { id: 1, image: "/images/dresscode/frau-1.png", correct: "angemessen" },
  { id: 2, image: "/images/dresscode/frau-2.png", correct: "angemessen" },
  { id: 3, image: "/images/dresscode/frau-3.png", correct: "unangemessen" },
  { id: 4, image: "/images/dresscode/frau-4.png", correct: "angemessen" },
  { id: 5, image: "/images/dresscode/frau-5.png", correct: "unangemessen" },
  { id: 6, image: "/images/dresscode/mann-1.png", correct: "angemessen" },
  { id: 7, image: "/images/dresscode/mann-2.png", correct: "unangemessen" },
  { id: 8, image: "/images/dresscode/mann-3.png", correct: "angemessen" },
  { id: 9, image: "/images/dresscode/mann-4.png", correct: "unangemessen" },
  { id: 10, image: "/images/dresscode/mann-5.png", correct: "angemessen" },
];

const SWIPE_THRESHOLD = 120;

type GamePhase = "start" | "playing" | "feedback" | "end";

export default function DresscodeSwipeGame() {
  const [phase, setPhase] = useState<GamePhase>("start");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentCard = CARDS[index];

  const decide = useCallback(
    (decision: Decision) => {
      const correct = decision === currentCard.correct;
      if (correct) setScore((s) => s + 1);
      setLastCorrect(correct);
      setDragX(0);
      setIsDragging(false);
      setPhase("feedback");
      setTimeout(() => {
        if (index + 1 >= CARDS.length) {
          setPhase("end");
        } else {
          setIndex((i) => i + 1);
          setPhase("playing");
        }
      }, 1000);
    },
    [currentCard, index],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (phase !== "playing") return;
    startXRef.current = e.clientX;
    setIsDragging(true);
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - startXRef.current);
  };

  const onPointerUp = () => {
    if (!isDragging) return;
    if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
      decide(dragX > 0 ? "angemessen" : "unangemessen");
    } else {
      setDragX(0);
      setIsDragging(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setScore(0);
    setDragX(0);
    setPhase("start");
  };

  const overlayOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const isSwipingRight = dragX > 0;
  const isSwipingLeft = dragX < 0;

  if (phase === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-ink mb-2">
            Dresscode — Erkennst du&apos;s?
          </h1>
          <p className="text-gray-mid max-w-sm">
            Sieh dir die Person an und entscheide: entspricht sie dem
            Ecclesia-Dresscode?
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-gray-mid border border-border rounded-xl p-4 max-w-xs w-full text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl">→</span>
            <span>
              <strong className="text-teal">Rechts</strong> = Angemessen
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">←</span>
            <span>
              <strong className="text-red-500">Links</strong> = Unangemessen
            </span>
          </div>
        </div>
        <button
          onClick={() => setPhase("playing")}
          className="bg-teal text-white font-semibold px-8 py-3 rounded-xl text-base hover:opacity-90 transition-opacity"
        >
          Jetzt starten
        </button>
      </div>
    );
  }

  if (phase === "end") {
    const perfect = score === CARDS.length;
    const good = score >= CARDS.length * 0.7;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
        <div className="text-5xl">{perfect ? "🎉" : good ? "👍" : "📖"}</div>
        <div>
          <h2 className="text-2xl font-bold text-ink mb-1">
            {score} / {CARDS.length} richtig
          </h2>
          <p className="text-gray-mid">
            {perfect
              ? "Perfekt! Du kennst den Dresscode auswendig."
              : good
                ? "Gut gemacht! Fast alles richtig."
                : "Schau den Dresscode nochmal durch und versuch es erneut."}
          </p>
        </div>
        <button
          onClick={restart}
          className="border border-teal text-teal font-semibold px-8 py-3 rounded-xl text-base hover:bg-teal hover:text-white transition-colors"
        >
          Nochmal spielen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4 select-none">
      {/* Progress */}
      <div className="text-sm text-gray-mid">
        {index + 1} / {CARDS.length}
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm">
        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
            transition: isDragging ? "none" : "transform 0.3s ease",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          className="relative rounded-2xl overflow-hidden border border-border bg-white shadow-sm"
        >
          <div className="relative w-full aspect-[3/4]">
            <Image
              src={currentCard.image}
              alt="Person"
              fill
              className="object-cover object-top"
              draggable={false}
              priority
            />
          </div>

          {/* Swipe overlays */}
          {isSwipingRight && (
            <div
              className="absolute inset-0 bg-teal/80 flex items-center justify-center rounded-2xl"
              style={{ opacity: overlayOpacity }}
            >
              <span className="text-white text-3xl font-bold border-4 border-white rounded-xl px-4 py-2 rotate-[-12deg]">
                ✓ Angemessen
              </span>
            </div>
          )}
          {isSwipingLeft && (
            <div
              className="absolute inset-0 bg-red-500/80 flex items-center justify-center rounded-2xl"
              style={{ opacity: overlayOpacity }}
            >
              <span className="text-white text-3xl font-bold border-4 border-white rounded-xl px-4 py-2 rotate-[12deg]">
                ✗ Unangemessen
              </span>
            </div>
          )}

          {/* Feedback overlay */}
          {phase === "feedback" && (
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-2xl ${
                lastCorrect ? "bg-teal/90" : "bg-red-500/90"
              }`}
            >
              <div className="text-center text-white">
                <div className="text-5xl mb-2">{lastCorrect ? "✓" : "✗"}</div>
                <div className="text-xl font-bold">
                  {lastCorrect ? "Richtig!" : "Falsch!"}
                </div>
                <div className="text-sm mt-1 opacity-90">
                  War: {currentCard.correct}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      {phase === "playing" && (
        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={() => decide("unangemessen")}
            className="flex-1 py-3 rounded-xl border-2 border-red-400 text-red-500 font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <span>←</span> Unangemessen
          </button>
          <button
            onClick={() => decide("angemessen")}
            className="flex-1 py-3 rounded-xl border-2 border-teal text-teal font-semibold hover:bg-teal/10 transition-colors flex items-center justify-center gap-2"
          >
            Angemessen <span>→</span>
          </button>
        </div>
      )}

      {/* Score indicator */}
      <div className="text-sm text-gray-mid">{score} richtig bisher</div>
    </div>
  );
}
