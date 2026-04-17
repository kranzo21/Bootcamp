"use client";

import { useState } from "react";

interface Props {
  itemType: "tutorial" | "ressource" | "instrument";
  itemId: string;
  initialFav: boolean;
  className?: string;
}

export default function FavouriteButton({
  itemType,
  itemId,
  initialFav,
  className = "",
}: Props) {
  const [isFav, setIsFav] = useState(initialFav);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    await fetch("/api/favourites", {
      method: isFav ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, itemId }),
    });
    setIsFav(!isFav);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={isFav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      className={`text-xl transition-colors disabled:opacity-50 ${
        isFav ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
      } ${className}`}
    >
      ★
    </button>
  );
}
