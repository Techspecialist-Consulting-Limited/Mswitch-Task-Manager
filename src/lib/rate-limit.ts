const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number = 100, windowMs: number = 60000) {
  const now = Date.now()

  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k)
  }

  const entry = store.get(key)
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) {
    return { success: false, remaining: 0 }
  }

  return { success: true, remaining: limit - entry.count }
}
