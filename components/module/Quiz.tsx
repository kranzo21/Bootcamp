"use client";
import type { Module, Track } from "@/types";

interface Props {
  module: Module;
  track: Track;
  userId: string;
  onComplete: () => void;
}

export default function Quiz({ module, onComplete }: Props) {
  return (
    <div>
      <p>Quiz für: {module.titel}</p>
      <button onClick={onComplete}>Zurück</button>
    </div>
  );
}
