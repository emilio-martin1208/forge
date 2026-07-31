export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * `today` is injected rather than read from Date.now() internally so this
 * stays pure and testable. "Current streak" counts backward from today if
 * today already has activity, otherwise from yesterday — a streak that's
 * still alive shouldn't reset to 0 just because today isn't over yet.
 */
export function computeStreaks(activeDates: Set<string>, today: string): StreakResult {
  let cursor = activeDates.has(today) ? today : addDays(today, -1);
  let currentStreak = 0;
  while (activeDates.has(cursor)) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...activeDates].sort();
  let longestStreak = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of sorted) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  }

  return { currentStreak, longestStreak };
}
