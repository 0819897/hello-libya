export function starsFor(correct: number, total: number): 0 | 1 | 2 | 3 {
  if (total <= 0) return 0;
  const pct = (correct / total) * 100;
  return pct >= 95 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0;
}

export function pointsFor(attempt: number): number {
  return attempt === 1 ? 10 : attempt === 2 ? 5 : 0;
}
