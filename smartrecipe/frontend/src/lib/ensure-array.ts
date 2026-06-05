export function ensureArray<T>(value: unknown, resource: string): T[] {
  if (Array.isArray(value)) return value
  throw new Error(`API ${resource}: expected array response`)
}
