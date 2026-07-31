"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CurrentUser } from "@forge/types";
import { languageGradient } from "@/lib/languageColor";

// Deliberately shows only real data (name, GitHub id, member-since date from
// /me) and a Dashboard link — no Settings/Sign out entries, since there's no
// real auth session or settings page behind them yet. A menu item that does
// nothing would be worse than a shorter menu.
export function ProfileMenu({ me }: { me: CurrentUser | null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const name = me?.name?.trim() || "Dev User";
  const initial = name.charAt(0).toUpperCase();
  const memberSince = me
    ? new Date(me.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  return (
    <div ref={containerRef} className="relative p-3">
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 gradient-surface p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar initial={initial} name={name} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{name}</p>
              {me && <p className="text-xs text-muted truncate">@{me.githubId}</p>}
            </div>
          </div>
          {memberSince && <p className="text-xs text-muted">Member since {memberSince}</p>}
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-xs gradient-accent-text hover:underline"
          >
            Dashboard →
          </Link>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 gradient-surface-hover px-2 py-2 text-left transition"
      >
        <Avatar initial={initial} name={name} size={26} />
        <span className="text-sm truncate">{name}</span>
      </button>
    </div>
  );
}

function Avatar({ initial, name, size }: { initial: string; name: string; size: number }) {
  return (
    <div
      className="shrink-0 flex items-center justify-center font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundImage: languageGradient(name) }}
    >
      {initial}
    </div>
  );
}
