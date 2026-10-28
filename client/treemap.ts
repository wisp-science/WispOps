export interface Rect { x: number; y: number; w: number; h: number }

/**
 * Squarified treemap layout (Bruls, Huizing and van Wijk): fills `bounds` with one
 * rectangle per positive value, in input order, keeping each close to square.
 * Callers pass values largest first.
 */
export function squarify<T>(items: readonly { value: number; item: T }[], bounds: Rect): (Rect & { item: T })[] {
  const total = items.reduce((sum, i) => sum + Math.max(0, i.value), 0)
  if (total <= 0 || bounds.w <= 0 || bounds.h <= 0) return []
  const scale = bounds.w * bounds.h / total
  const out: (Rect & { item: T })[] = []
  let rect = { ...bounds }
  let row: { area: number; item: T }[] = []
  // Aspect ratio of the most elongated rectangle if `areas` share one strip of length `side`.
  const worst = (areas: readonly { area: number }[], side: number) => {
    const sum = areas.reduce((s, a) => s + a.area, 0)
    return Math.max(...areas.map(a => Math.max(side * side * a.area / (sum * sum), sum * sum / (side * side * a.area))))
  }
  const flush = () => {
    const sum = row.reduce((s, a) => s + a.area, 0)
    if (rect.w >= rect.h) {
      const w = Math.min(rect.w, sum / rect.h)
      let y = rect.y
      for (const r of row) { const h = r.area / w; out.push({ x: rect.x, y, w, h, item: r.item }); y += h }
      rect = { x: rect.x + w, y: rect.y, w: rect.w - w, h: rect.h }
    } else {
      const h = Math.min(rect.h, sum / rect.w)
      let x = rect.x
      for (const r of row) { const w = r.area / h; out.push({ x, y: rect.y, w, h, item: r.item }); x += w }
      rect = { x: rect.x, y: rect.y + h, w: rect.w, h: rect.h - h }
    }
    row = []
  }
  for (const { value, item } of items) {
    if (!(value > 0)) continue
    const next = { area: value * scale, item }
    const side = Math.min(rect.w, rect.h)
    if (row.length > 0 && worst([...row, next], side) > worst(row, side)) flush()
    row.push(next)
  }
  if (row.length > 0) flush()
  return out
}
