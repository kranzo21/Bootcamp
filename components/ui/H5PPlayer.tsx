"use client";
import { useEffect, useRef } from "react";

interface Props {
  contentPath: string; // e.g. "/h5p-content/mein-quiz"
}

export default function H5PPlayer({ contentPath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    // Unique ID per instance
    const id = `h5p-${Math.random().toString(36).slice(2)}`;
    containerRef.current.id = id;

    import("h5p-standalone").then(({ default: H5P }) => {
      new H5P(`#${id}`, {
        h5pJsonPath: contentPath,
        frameJs: "/h5p-assets/frame.bundle.js",
        frameCss: "/h5p-assets/styles/h5p.css",
      });
    });
  }, [contentPath]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
