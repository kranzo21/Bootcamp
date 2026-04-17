"use client";

import Link from "next/link";
import FavouriteButton from "./FavouriteButton";

interface Props {
  id: string;
  name: string;
  slug: string;
  description?: string;
  initialFav: boolean;
}

export default function InstrumentCard({
  id,
  name,
  slug,
  description,
  initialFav,
}: Props) {
  return (
    <div className="relative">
      <Link
        href={`/instrument/${slug}`}
        className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow text-center block"
      >
        <p className="font-semibold text-ink">{name}</p>
        {description && (
          <p className="text-xs text-gray-mid mt-1">{description}</p>
        )}
      </Link>
      <FavouriteButton
        itemType="instrument"
        itemId={id}
        initialFav={initialFav}
        className="absolute top-2 right-2"
      />
    </div>
  );
}
