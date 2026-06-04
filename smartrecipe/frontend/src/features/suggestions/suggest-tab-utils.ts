export type SuggestTabId = "ready" | "almost" | "needs-more";

export function parseSuggestTab(
  value: string | null,
): SuggestTabId | undefined {
  if (value === "ready" || value === "almost" || value === "needs-more")
    return value;
  return undefined;
}

export function defaultSuggestTab(counts: {
  ready: number;
  almost: number;
  needsMore: number;
}): SuggestTabId {
  if (counts.ready > 0) return "ready";
  if (counts.almost > 0) return "almost";
  if (counts.needsMore > 0) return "needs-more";
  return "ready";
}
