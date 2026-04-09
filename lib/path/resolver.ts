import type { Instrument, Path } from "@/types";

const TONAL_INSTRUMENTS: Instrument[] = [
  "klavier",
  "gitarre",
  "e-gitarre",
  "bass",
  "geige",
];

export function resolvePath(instruments: Instrument[]): Path {
  if (instruments.some((i) => TONAL_INSTRUMENTS.includes(i)))
    return "instrumentalist";
  if (instruments.includes("vocals")) return "vocals";
  return "drums";
}
