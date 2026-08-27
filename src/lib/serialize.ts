
export function serializePrisma<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) {
    return obj.map((item) => serializePrisma(item)) as T
  }
  if (obj instanceof Date) {
    return obj.toISOString() as T
  }
  if (isDecimalLike(obj)) {
    return toPlainNumber(obj) as T
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

function isDecimalLike(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false
  const name = (obj as { constructor?: { name?: string } }).constructor?.name
  if (name === 'Decimal' || name === 'PrismaDecimal') return true
  const o = obj as { s?: unknown; e?: unknown; d?: unknown; toNumber?: unknown; toFixed?: unknown }
  if (typeof o.toNumber === 'function' && typeof o.toFixed === 'function') return true
  
  if ('s' in o && 'e' in o && 'd' in o && Array.isArray(o.d)) return true
  return false
}

function toPlainNumber(obj: unknown): number {
  const o = obj as { toNumber?: () => number; toString?: () => string }
  if (typeof o.toNumber === 'function') {
    const n = o.toNumber()
    if (Number.isFinite(n)) return n
  }
  const n = Number(typeof o.toString === 'function' ? o.toString() : obj)
  return Number.isFinite(n) ? n : 0
}
