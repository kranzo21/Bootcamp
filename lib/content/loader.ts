import type { Module, Path, Track } from "@/types";
import instrumentalistTheologie from "@/content/instrumentalist/theologie.json";
import instrumentalistTheorie from "@/content/instrumentalist/theorie.json";
import vocalsTheologie from "@/content/vocals/theologie.json";
import vocalsTheorie from "@/content/vocals/theorie.json";
import drumsTheologie from "@/content/drums/theologie.json";
import drumsTheorie from "@/content/drums/theorie.json";

const CONTENT: Record<Path, Record<Track, Module[]>> = {
  instrumentalist: {
    theologie: instrumentalistTheologie as Module[],
    theorie: instrumentalistTheorie as Module[],
  },
  vocals: {
    theologie: vocalsTheologie as Module[],
    theorie: vocalsTheorie as Module[],
  },
  drums: {
    theologie: drumsTheologie as Module[],
    theorie: drumsTheorie as Module[],
  },
};

export function getModules(path: Path, track: Track): Module[] {
  return CONTENT[path][track];
}

export function getModule(
  path: Path,
  track: Track,
  moduleId: string,
): Module | undefined {
  return CONTENT[path][track].find((m) => m.id === moduleId);
}

export function getMaterialIds(module: Module): string[] {
  const videoIds = module.videos.map((_, i) => `video-${i}`);
  const textIds = module.texte.map((_, i) => `text-${i}`);
  return [...videoIds, ...textIds];
}
