import { createClient } from "@/lib/supabase/server";
import { getPrograms, getAreasByProgram } from "@/lib/db/programs";
import { getLektionenByArea } from "@/lib/db/lektionen";
import {
  getLektionProgress,
  getUserBadges,
  getUserQualifications,
  getUserPrograms,
} from "@/lib/db/progress";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name, is_admin")
    .eq("id", user!.id)
    .single();

  const [allPrograms, userPrograms, lektionProgress, userBadgeRows, userQuals] =
    await Promise.all([
      getPrograms(),
      getUserPrograms(user!.id),
      getLektionProgress(user!.id),
      getUserBadges(user!.id),
      getUserQualifications(user!.id),
    ]);

  const enrolledProgramIds = new Set(userPrograms.map((up) => up.program_id));
  const enrolledPrograms = allPrograms.filter((p) =>
    enrolledProgramIds.has(p.id),
  );

  // Fortschritt pro Programm berechnen
  const progressByProgram: Record<string, { done: number; total: number }> = {};
  for (const program of enrolledPrograms) {
    const areas = await getAreasByProgram(program.id);
    let total = 0;
    let done = 0;
    for (const area of areas) {
      const lektionen = await getLektionenByArea(area.id);
      total += lektionen.length;
      const passedIds = new Set(
        lektionProgress.filter((p) => p.passed).map((p) => p.lektion_id),
      );
      done += lektionen.filter((l) => passedIds.has(l.id)).length;
    }
    progressByProgram[program.id] = { done, total };
  }

  // Abzeichen mit Namen
  const { data: badgeDetails } = await supabase
    .from("user_badges")
    .select("earned_at, badges(id, name, icon, description)")
    .eq("user_id", user!.id);

  // Qualifikationen mit Namen
  const { data: qualDetails } = await supabase
    .from("user_qualifications")
    .select("confirmed_at, qualifications(id, name, description)")
    .eq("user_id", user!.id);

  const firstName = profile?.name?.split(" ")[0] ?? "Hey";

  return (
    <>
      {/* Greeting */}
      <div className="mb-6">
        <p className="text-sm font-light text-gray-mid">Guten Tag,</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          {firstName}
        </h1>
      </div>

      {/* Meine Programme */}
      <section className="mb-8">
        <p className="text-[8px] uppercase tracking-[3px] text-tan font-semibold mb-3">
          Meine Programme
        </p>
        {enrolledPrograms.length === 0 ? (
          <p className="text-sm text-gray-mid">
            Du bist noch in keinem Programm eingeschrieben.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {enrolledPrograms.map((program) => {
              const { done, total } = progressByProgram[program.id] ?? {
                done: 0,
                total: 0,
              };
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link
                  key={program.id}
                  href={`/programm/${program.slug}`}
                  className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <p className="text-[8px] uppercase tracking-[2px] text-tan mb-1">
                    Programm
                  </p>
                  <p className="font-bold text-ink mb-1 tracking-tight">
                    {program.name}
                  </p>
                  <p className="text-xs text-gray-mid mb-3 line-clamp-1">
                    {program.description}
                  </p>
                  <div className="h-0.5 bg-border rounded-full">
                    <div
                      className="h-0.5 bg-teal rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-mid mt-1.5">
                    {done} / {total} Lektionen abgeschlossen
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Abzeichen */}
      {badgeDetails && badgeDetails.length > 0 && (
        <section className="mb-8">
          <p className="text-[8px] uppercase tracking-[3px] text-tan font-semibold mb-3">
            Abzeichen
          </p>
          <div className="flex flex-wrap gap-3">
            {badgeDetails.map((row: any) => (
              <div
                key={row.badges.id}
                className="bg-white border border-border rounded-xl p-3 flex flex-col items-center w-20 text-center"
              >
                <span className="text-2xl mb-1">{row.badges.icon}</span>
                <span className="text-[10px] font-medium text-ink leading-tight">
                  {row.badges.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Qualifikationen */}
      {qualDetails && qualDetails.length > 0 && (
        <section>
          <p className="text-[8px] uppercase tracking-[3px] text-tan font-semibold mb-3">
            Qualifikationen
          </p>
          <div className="flex flex-col gap-2">
            {qualDetails.map((row: any) => (
              <div
                key={row.qualifications.id}
                className="bg-white border border-border rounded-xl p-4 flex items-center gap-3"
              >
                <span className="text-xl">🎓</span>
                <div>
                  <p className="font-semibold text-sm text-ink">
                    {row.qualifications.name}
                  </p>
                  <p className="text-xs text-gray-mid">
                    Bestätigt am{" "}
                    {new Date(row.confirmed_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
