import type { Module, Progress } from "@/types";

interface Props {
  track: "theologie" | "theorie";
  modules: Module[];
  progress: Progress[];
}

export default function UserDetail({ track, modules, progress }: Props) {
  const label = track === "theologie" ? "Theologie" : "Theorie";
  const passed = progress.filter((p) => p.track === track && p.passed).length;
  const percent = modules.length > 0 ? (passed / modules.length) * 100 : 0;

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-semibold text-lg mb-3">
        {label} — {Math.round(percent)}% abgeschlossen
      </h3>
      <div className="flex flex-col gap-2 text-sm">
        {modules.map((m) => {
          const done = progress.find(
            (p) => p.module_id === m.id && p.track === track && p.passed,
          );
          return (
            <div key={m.id} className="flex items-center gap-2">
              <span className={done ? "text-green-600" : "text-gray-400"}>
                {done ? "✓" : "○"}
              </span>
              <span>{m.titel}</span>
              {done && done.completed_at && (
                <span className="text-gray-400 text-xs ml-auto">
                  {new Date(done.completed_at).toLocaleDateString("de-DE")}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
