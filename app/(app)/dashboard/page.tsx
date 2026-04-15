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
    .select("name")
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

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Hallo, {profile?.name}!</h1>
        <form action="/api/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-gray-500 hover:underline"
          >
            Abmelden
          </button>
        </form>
      </div>

      {/* Programme */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Meine Programme</h2>
        {enrolledPrograms.length === 0 ? (
          <p className="text-gray-500">
            Du bist noch in keinem Programm eingeschrieben.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="border rounded-lg p-4 hover:shadow transition"
                >
                  <h3 className="font-semibold text-lg mb-1">{program.name}</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {program.description}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {done} / {total} Lektionen abgeschlossen
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Abzeichen */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Meine Abzeichen</h2>
        {!badgeDetails || badgeDetails.length === 0 ? (
          <p className="text-gray-500">Noch keine Abzeichen verdient.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {badgeDetails.map((row: any) => (
              <div
                key={row.badges.id}
                className="border rounded-lg p-3 flex flex-col items-center w-24 text-center"
              >
                <span className="text-3xl mb-1">{row.badges.icon}</span>
                <span className="text-xs font-medium">{row.badges.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Qualifikationen */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Meine Qualifikationen</h2>
        {!qualDetails || qualDetails.length === 0 ? (
          <p className="text-gray-500">Noch keine Qualifikationen bestätigt.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {qualDetails.map((row: any) => (
              <div
                key={row.qualifications.id}
                className="border rounded-lg p-4 flex items-center gap-3"
              >
                <span className="text-2xl">🎓</span>
                <div>
                  <p className="font-semibold">{row.qualifications.name}</p>
                  <p className="text-xs text-gray-500">
                    Bestätigt am{" "}
                    {new Date(row.confirmed_at).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
