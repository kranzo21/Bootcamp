"use client";
import { useEffect, useRef } from "react";

interface Props {
  contentPath: string;
  onComplete?: () => void;
}

export default function H5PPlayer({ contentPath, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const id = `h5p-${Math.random().toString(36).slice(2)}`;
    containerRef.current.id = id;

    import("h5p-standalone").then(({ default: H5P }) => {
      new H5P(`#${id}`, {
        h5pJsonPath: contentPath,
        frameJs: "/h5p-assets/frame.bundle.js",
        frameCss: "/h5p-assets/styles/h5p.css",
      });

      if (onComplete) {
        const H5PGlobal = (window as any).H5P;
        if (H5PGlobal?.externalDispatcher) {
          H5PGlobal.externalDispatcher.on("xAPI", (event: any) => {
            if (event?.data?.statement?.result?.success === true) {
              onComplete();
            }
          });
        }
      }
    });
  }, [contentPath, onComplete]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border">
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
