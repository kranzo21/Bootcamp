"use client";

import { useEffect } from "react";
import type { Video } from "@/types";

interface Props {
  video: Video;
  materialId: string;
  onViewed: (materialId: string) => void;
}

export default function VideoPlayer({ video, materialId, onViewed }: Props) {
  useEffect(() => {
    onViewed(materialId);
  }, [materialId, onViewed]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">{video.titel}</h3>
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={video.url}
          title={video.titel}
          allowFullScreen
          className="absolute inset-0 w-full h-full rounded"
        />
      </div>
    </div>
  );
}
