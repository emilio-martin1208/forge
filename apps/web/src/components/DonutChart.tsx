"use client";

import { useState } from "react";
import { hashToHue } from "@/lib/languageColor";

export interface DonutSlice {
  name: string;
  percentage: number;
}

const SIZE = 200;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Interactive donut — hover a segment or its legend row to see what it actually is; nothing is
 * labeled with a bare percentage until you interact with it. */
export function DonutChart({ data, centerLabel }: { data: DonutSlice[]; centerLabel: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const top = data.slice(0, 8);
  const active = hovered !== null ? top[hovered] : null;

  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-8">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
          {top.map((slice, i) => {
            const dash = (slice.percentage / 100) * CIRCUMFERENCE;
            const dashOffset = -offset;
            offset += dash;
            const hue = hashToHue(slice.name);
            const isHovered = hovered === i;
            return (
              <circle
                key={slice.name}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={`hsl(${hue} 75% 62%)`}
                strokeWidth={isHovered ? STROKE + 8 : STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={dashOffset}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                style={{ transition: "stroke-width 150ms ease", cursor: "pointer", opacity: hovered === null || isHovered ? 1 : 0.45 }}
              />
            );
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" style={{ fontSize: 22, fontWeight: 700, fill: "var(--foreground)" }}>
          {active ? `${active.percentage}%` : centerLabel}
        </text>
        <text x="50%" y="60%" textAnchor="middle" style={{ fontSize: 11, fill: "var(--muted)" }}>
          {active ? active.name : "hover a segment"}
        </text>
      </svg>

      <div className="flex flex-col gap-1 min-w-0">
        {top.map((slice, i) => (
          <button
            key={slice.name}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-center gap-2 text-sm text-left px-2 py-1.5 transition ${
              hovered === i ? "gradient-surface" : ""
            }`}
          >
            <span className="w-2.5 h-2.5 shrink-0" style={{ background: `hsl(${hashToHue(slice.name)} 75% 62%)` }} />
            <span className="truncate">{slice.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
