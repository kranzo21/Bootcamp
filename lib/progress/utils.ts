const PASSING_THRESHOLD = 0.8;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function calculateScore(
  correctAnswers: number[],
  givenAnswers: number[],
): number {
  const correct = givenAnswers.filter(
    (ans, i) => ans === correctAnswers[i],
  ).length;
  return correct / correctAnswers.length;
}

export function isPassing(score: number): boolean {
  return score >= PASSING_THRESHOLD;
}

export function isCooledDown(lastAttemptAt: string | null): boolean {
  if (!lastAttemptAt) return true;
  return Date.now() - new Date(lastAttemptAt).getTime() > COOLDOWN_MS;
}
