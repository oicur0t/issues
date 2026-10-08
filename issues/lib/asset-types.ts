/**
 * Asset grouping for the Assets page. `type` is free-form, but these are the standard
 * categories, shown first and in this order. Anything else is grouped by its own type after them.
 */
export const ASSET_CATEGORIES = ['physical server', 'virtual server', 'desktop', 'laptop', 'device'] as const

export interface AssetGroup<T> {
  key: string
  label: string
  assets: T[]
}

const UNCLASSIFIED = 'unclassified'

export function normalizeAssetType(type?: string | null): string {
  return (type ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Groups assets by type: standard categories first (in order), then other types alphabetically,
 * then unclassified. Assets inside a group are sorted by name. Empty groups are omitted.
 */
export function groupAssetsByType<T extends { type?: string | null; name: string }>(assets: T[]): AssetGroup<T>[] {
  const byType = new Map<string, T[]>()
  for (const asset of assets) {
    const key = normalizeAssetType(asset.type) || UNCLASSIFIED
    const list = byType.get(key) ?? []
    list.push(asset)
    byType.set(key, list)
  }

  const categories: string[] = [...ASSET_CATEGORIES]
  const rank = (key: string) => {
    if (key === UNCLASSIFIED) return Number.MAX_SAFE_INTEGER
    const index = categories.indexOf(key)
    return index === -1 ? categories.length : index
  }

  return Array.from(byType.entries())
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([key, list]) => ({
      key,
      label: capitalize(key),
      assets: [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    }))
}
