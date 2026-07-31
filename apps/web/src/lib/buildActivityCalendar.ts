export interface CalendarCell {
  date: string;
  count: number;
}

/**
 * GitHub/Claude-Code-style contribution grid: weeks as columns, Sun-Sat as
 * rows within each column, ending on the Saturday of the current week so
 * the grid always renders full weeks. `today` is injected for testability.
 */
export function buildActivityCalendar(
  activityByDate: { date: string; count: number }[],
  today: string,
  weeks = 16,
): CalendarCell[][] {
  const countsByDate = new Map(activityByDate.map((a) => [a.date, a.count]));

  const todayDate = new Date(today + "T00:00:00Z");
  const daysUntilSaturday = 6 - todayDate.getUTCDay();
  const gridEnd = new Date(todayDate);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + daysUntilSaturday);

  const totalDays = weeks * 7;
  const gridStart = new Date(gridEnd);
  gridStart.setUTCDate(gridStart.getUTCDate() - totalDays + 1);

  const columns: CalendarCell[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < weeks; w++) {
    const column: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateKey = cursor.toISOString().slice(0, 10);
      column.push({ date: dateKey, count: countsByDate.get(dateKey) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    columns.push(column);
  }
  return columns;
}

/** Buckets a count into a 0-4 intensity tier relative to the busiest day, for coloring. */
export function activityTier(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}
