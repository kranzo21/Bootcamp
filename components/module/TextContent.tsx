"use client";

import { useEffect } from "react";
import type { Text } from "@/types";

interface Props {
  text: Text;
  materialId: string;
  onViewed: (materialId: string) => void;
}

export default function TextContent({ text, materialId, onViewed }: Props) {
  useEffect(() => {
    onViewed(materialId);
  }, [materialId, onViewed]);

  return (
    <div className="border-l-4 border-blue-400 pl-4 py-2">
      <h3 className="font-medium mb-2">{text.titel}</h3>
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {text.inhalt}
      </p>
    </div>
  );
}
