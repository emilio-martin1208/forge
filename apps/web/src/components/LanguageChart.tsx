import type { LanguageBreakdown } from "@forge/types";
import { languageGradient } from "@/lib/languageColor";

export function LanguageChart({ languages }: { languages: LanguageBreakdown[] }) {
  if (languages.length === 0) {
    return <p className="text-sm text-muted">No language data yet — connect a repository to see this.</p>;
  }

  const top = languages.slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-4 w-full overflow-hidden">
        {top.map((lang) => (
          <div
            key={lang.name}
            style={{ width: `${lang.percentage}%`, backgroundImage: languageGradient(lang.name) }}
            title={`${lang.name} · ${lang.percentage}%`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {top.map((lang) => (
          <div key={lang.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundImage: languageGradient(lang.name) }} />
            <span className="truncate">{lang.name}</span>
            <span className="text-muted ml-auto">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
