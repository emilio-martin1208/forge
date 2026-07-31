import type { LanguageBreakdown, LanguageStat } from "@forge/types";

/** Merges language stats across every project's latest Snapshot by summed line count. */
export function aggregateLanguages(languagesList: LanguageStat[][]): LanguageBreakdown[] {
  const totals = new Map<string, number>();
  for (const languages of languagesList) {
    for (const lang of languages) {
      totals.set(lang.name, (totals.get(lang.name) ?? 0) + lang.lineCount);
    }
  }

  const grandTotal = [...totals.values()].reduce((a, b) => a + b, 0) || 1;

  return [...totals.entries()]
    .map(([name, totalLines]) => ({
      name,
      totalLines,
      percentage: Math.round((totalLines / grandTotal) * 1000) / 10,
    }))
    .sort((a, b) => b.totalLines - a.totalLines);
}
