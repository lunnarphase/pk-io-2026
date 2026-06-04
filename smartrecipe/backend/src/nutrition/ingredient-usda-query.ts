function normalizeKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * USDA FDC search strings: English from DeepL first, then normalized Polish name as fallback.
 */
export function buildUsdaSearchQueries(
  polishName: string,
  englishTranslation?: string | null,
): string[] {
  const key = normalizeKey(polishName);
  if (!key) return [];

  const out: string[] = [];
  const en = englishTranslation?.trim();
  if (en && !out.includes(en)) out.push(en);

  if (!out.includes(key)) out.push(key);

  return out.slice(0, 4);
}
