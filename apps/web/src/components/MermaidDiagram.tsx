"use client";

import { useEffect, useId, useRef, useState } from "react";

export function MermaidDiagram({ source }: { source: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramId = useId().replace(/:/g, "-");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: "dark", themeVariables: { fontFamily: "inherit" } });
      try {
        const { svg } = await mermaid.render(`mermaid-${diagramId}`, source);
        if (!cancelled && containerRef.current) containerRef.current.innerHTML = svg;
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [source, diagramId]);

  if (error) {
    return <p className="text-sm text-red-400">Couldn&apos;t render diagram: {error}</p>;
  }

  return <div ref={containerRef} className="flex justify-center [&_svg]:max-w-full" />;
}
