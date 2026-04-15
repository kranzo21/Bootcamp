// app/api/quiz/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function calculateScore(correct: number[], given: (number | null)[]): number {
  const hits = correct.filter((c, i) => c === given[i]).length;
  return hits / correct.length;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lektionId, correctAnswers, givenAnswers } = await request.json();

  if (
    !lektionId ||
    !Array.isArray(correctAnswers) ||
    !Array.isArray(givenAnswers) ||
    correctAnswers.length === 0 ||
    correctAnswers.length !== givenAnswers.length
  ) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const score = calculateScore(correctAnswers, givenAnswers);
  const passed = score >= 0.8;

  await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    lektion_id: lektionId,
    score,
    passed,
  });

  if (passed) {
    await supabase.from("lektion_progress").upsert({
      user_id: user.id,
      lektion_id: lektionId,
      materials_completed: true,
      passed: true,
      completed_at: new Date().toISOString(),
    });

    // Abzeichen vergeben
    const { data: badge } = await supabase
      .from("badges")
      .select("id")
      .eq("lektion_id", lektionId)
      .single();

    if (badge) {
      await supabase.from("user_badges").upsert({
        user_id: user.id,
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ score, passed });
}
