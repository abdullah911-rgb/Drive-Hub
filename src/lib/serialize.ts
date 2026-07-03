export function serializePrisma<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) {
    return obj.map((item) => serializePrisma(item)) as T
  }
  if (obj instanceof Date) {
    return obj.toISOString() as T
  }
  if (obj && typeof obj === 'object' && obj.constructor?.name === 'Decimal') {
    return Number((obj as { toString(): string }).toString()) as T
  }
  if (typeof obj === 'object') {
    const res: Record<string, unknown> = {}
    for (const key of Object.keys(obj as object)) {
      res[key] = serializePrisma((obj as Record<string, unknown>)[key])
    }
    return res as T
  }
  return obj
}
