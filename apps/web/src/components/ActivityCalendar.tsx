import { activityTier, buildActivityCalendar, type CalendarCell } from "@/lib/buildActivityCalendar";
import type { DailyActivity } from "@forge/types";

const WEEKDAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function ActivityCalendar({ activityByDate }: { activityByDate: DailyActivity[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const weeks = buildActivityCalendar(activityByDate, today, 16);
  const maxCount = Math.max(0, ...activityByDate.map((a) => a.count));

  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-1 pt-4 text-[10px] text-muted">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="h-3 leading-3">
            {label}
          </span>
        ))}
      </div>
      <div className="flex gap-1 overflow-x-auto">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((cell) => (
              <Cell key={cell.date} cell={cell} maxCount={maxCount} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({ cell, maxCount }: { cell: CalendarCell; maxCount: number }) {
  const tier = activityTier(cell.count, maxCount);
  return (
    <div
      className={`w-3 h-3 activity-${tier}`}
      title={`${cell.date}: ${cell.count} ${cell.count === 1 ? "event" : "events"}`}
    />
  );
}
