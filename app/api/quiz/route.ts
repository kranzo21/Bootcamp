import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { calculateScore, isPassing } from "@/lib/progress/utils";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { moduleId, track, correctAnswers, givenAnswers } =
    await request.json();

  const score = calculateScore(correctAnswers, givenAnswers);
  const passed = isPassing(score);

  await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    module_id: moduleId,
    score,
    passed,
  });

  if (passed) {
    await supabase.from("progress").upsert({
      user_id: user.id,
      module_id: moduleId,
      track,
      materials_completed: true,
      passed: true,
      completed_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ score, passed });
}
