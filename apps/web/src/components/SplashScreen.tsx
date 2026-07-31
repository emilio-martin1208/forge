"use client";

import { useEffect, useState } from "react";

/** Mirrors Shinobi's brush-reveal / slash-cut splash sequence, adapted to Forge's
 * text-based mark (gradient-filled "F" monogram) instead of an image asset. */
export function SplashScreen() {
  const [isCutting, setIsCutting] = useState(false);
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const [isOut, setIsOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const cutTimer = setTimeout(() => setIsCutting(true), 2250);
    const wordmarkTimer = setTimeout(() => setWordmarkVisible(true), 2250 + 650);
    const outTimer = setTimeout(() => setIsOut(true), 4800);
    const hideTimer = setTimeout(() => setIsHidden(true), 4800 + 750);
    return () => {
      clearTimeout(cutTimer);
      clearTimeout(wordmarkTimer);
      clearTimeout(outTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (isHidden) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-700"
      style={{ opacity: isOut ? 0 : 1, pointerEvents: isOut ? "none" : "auto" }}
    >
      <div className="grid place-items-center" style={{ filter: "drop-shadow(0 0 40px color-mix(in srgb, var(--accent-via) 65%, transparent))" }}>
        <div
          className="relative gradient-accent"
          style={{
            gridArea: "1 / 1",
            width: "min(30vw, 140px)",
            aspectRatio: "1",
            clipPath: "polygon(0% 0%, 0% 0%, -25% 100%, -25% 100%)",
            animation: "forge-brush-reveal 1.9s cubic-bezier(0.22,1,0.36,1) 0.2s forwards",
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center text-white font-bold"
            style={{
              fontSize: "clamp(36px, 8vw, 64px)",
              clipPath: "inset(0 0 50% 0)",
              transform: isCutting ? "translateY(-40px)" : "translateY(0)",
              opacity: isCutting ? 0 : 1,
              transition: isCutting ? "transform 0.55s 0.28s ease, opacity 0.55s 0.28s ease" : "none",
            }}
          >
            F
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center text-white font-bold"
            style={{
              fontSize: "clamp(36px, 8vw, 64px)",
              clipPath: "inset(50% 0 0 0)",
              transform: isCutting ? "translateY(40px)" : "translateY(0)",
              opacity: isCutting ? 0 : 1,
              transition: isCutting ? "transform 0.55s 0.28s ease, opacity 0.55s 0.28s ease" : "none",
            }}
          >
            F
          </div>
          {isCutting && (
            <div
              className="absolute left-[-20%] w-[140%] h-0.5 pointer-events-none"
              style={{
                top: "50%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 30%, white 50%, rgba(255,255,255,0.95) 70%, transparent)",
                animation: "forge-slash-sweep 0.4s ease-out forwards",
              }}
            />
          )}
        </div>
        <span
          className="gradient-accent-text font-bold tracking-wide whitespace-nowrap transition-all duration-700"
          style={{
            gridArea: "1 / 1",
            fontSize: "clamp(28px, 7vw, 56px)",
            opacity: wordmarkVisible ? 1 : 0,
            transform: wordmarkVisible ? "translateY(0)" : "translateY(12px)",
          }}
        >
          FORGE
        </span>
      </div>

      <style>{`
        @keyframes forge-brush-reveal {
          0%   { clip-path: polygon(0% 0%,   0%   0%, -25% 100%, -25% 100%); }
          100% { clip-path: polygon(0% 0%, 125%   0%, 100% 100%, -25% 100%); }
        }
        @keyframes forge-slash-sweep {
          0%   { opacity: 0; transform: rotate(-6deg) translateX(-115%); }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { opacity: 0; transform: rotate(-6deg) translateX(115%); }
        }
      `}</style>
    </div>
  );
}
