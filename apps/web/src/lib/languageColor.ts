/** Deterministic name -> hue (0-359) so the same language always gets the same chart color. */
export function hashToHue(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function languageGradient(name: string): string {
  const hue = hashToHue(name);
  return `linear-gradient(135deg, hsl(${hue} 75% 62%), hsl(${(hue + 35) % 360} 75% 55%))`;
}
