"use client";

import { useId, useState } from "react";

const SIZE = 84;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A score is a ring you can hover, not a bare number — the number stays (it's real, useful
 * precision), but it's the label inside a chart, not the whole display. No card behind it —
 * the ring already carries the color, a box around it just adds a grey rectangle. */
export function RadialScore({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const gradientId = useId();
  const dash = (Math.max(0, Math.min(100, value)) / 100) * CIRCUMFERENCE;

  return (
    <div
      className="flex items-center gap-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-from)" />
            <stop offset="100%" stopColor="var(--accent-to)" />
          </linearGradient>
        </defs>
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={hovered ? STROKE + 3 : STROKE}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
            style={{ transition: "stroke-width 150ms ease" }}
          />
        </g>
        <text x="50%" y="54%" textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: "var(--foreground)" }}>
          {value}
        </text>
      </svg>
      <span className={`text-xs uppercase tracking-wide capitalize ${highlight ? "gradient-accent-text font-semibold" : "text-muted"}`}>
        {label}
      </span>
    </div>
  );
}
