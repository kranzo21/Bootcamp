"use client";

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="text-[9px] uppercase tracking-[2px] text-gray-mid hover:text-teal transition-colors mb-4 block"
    >
      ← Zurück
    </button>
  );
}
