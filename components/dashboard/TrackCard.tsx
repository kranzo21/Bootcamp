import Link from "next/link";
import ProgressBar from "./ProgressBar";
import type { Module, Progress } from "@/types";

interface Props {
  track: "theologie" | "theorie";
  modules: Module[];
  progress: Progress[];
}

export default function TrackCard({ track, modules, progress }: Props) {
  const trackLabel = track === "theologie" ? "Theologie" : "Theorie";
  const passed = progress.filter((p) => p.track === track && p.passed).length;
  const percent = modules.length > 0 ? (passed / modules.length) * 100 : 0;

  const nextModule = modules.find(
    (m) =>
      !progress.find(
        (p) => p.module_id === m.id && p.track === track && p.passed,
      ),
  );

  return (
    <div className="border rounded-lg p-5 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">{trackLabel}</h2>
      <ProgressBar
        percent={percent}
        label={`${passed} / ${modules.length} Module abgeschlossen`}
      />

      {nextModule ? (
        <Link
          href={`/modul/${track}/${nextModule.id}`}
          className="bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
        >
          Weiter: {nextModule.titel}
        </Link>
      ) : (
        <p className="text-green-600 font-medium text-center">
          Track abgeschlossen!
        </p>
      )}

      <div className="flex flex-col gap-1 text-sm">
        {modules.map((m) => {
          const done = progress.find(
            (p) => p.module_id === m.id && p.track === track && p.passed,
          );
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span>{done ? "✓" : "○"}</span>
              <span className={done ? "line-through text-gray-400" : ""}>
                {m.titel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
