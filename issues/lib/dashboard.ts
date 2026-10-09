/**
 * Pure shaping of dashboard numbers (no database access), so it can be unit tested.
 */
import { groupAssetsByType } from './asset-types'

// ---------- Assets ----------

export interface AssetLike {
  type?: string | null
  status?: string
  needsReview?: boolean
  tailscale?: { warnings?: unknown[] } | null
}

export interface AssetSummary {
  total: number
  active: number
  byCategory: Array<{ key: string; label: string; count: number }>
  byStatus: Record<string, number>
  withWarnings: number // active assets with at least one Tailscale warning
  needsReview: number
}

/** Counts assets by the same type categories the Assets page groups by, plus health */
export function summarizeAssets(assets: AssetLike[]): AssetSummary {
  const byStatus: Record<string, number> = {}
  let withWarnings = 0
  let needsReview = 0

  for (const asset of assets) {
    const status = asset.status ?? 'active'
    byStatus[status] = (byStatus[status] ?? 0) + 1
    if (status === 'active' && (asset.tailscale?.warnings?.length ?? 0) > 0) withWarnings++
    if (asset.needsReview) needsReview++
  }

  const byCategory = groupAssetsByType(assets.map(a => ({ type: a.type, name: '' }))).map(group => ({
    key: group.key,
    label: group.label,
    count: group.assets.length,
  }))

  return {
    total: assets.length,
    active: byStatus.active ?? 0,
    byCategory,
    byStatus,
    withWarnings,
    needsReview,
  }
}

// ---------- Projects ----------

export interface ProjectRef {
  _id: unknown
  key: string
  name: string
}

export interface CountRow {
  projectId: unknown
  status: string
  count: number
}

export interface ProjectStats {
  id: string
  key: string
  name: string
  issues: {
    total: number
    open: number // backlog + in progress + blocked
    backlog: number
    inProgress: number
    blocked: number
    fixed: number
    wontFix: number
  }
  features: {
    total: number
    active: number // planned + in progress
    proposed: number
    planned: number
    inProgress: number
    shipped: number
    dropped: number
  }
  assets: number
}

const sum = (rows: CountRow[], projectId: string, status?: string) =>
  rows
    .filter(r => String(r.projectId) === projectId && (status === undefined || r.status === status))
    .reduce((total, r) => total + r.count, 0)

/** Builds one stats object per project from grouped issue/feature counts and asset links */
export function buildProjectStats(
  projects: ProjectRef[],
  issueRows: CountRow[],
  featureRows: CountRow[],
  assetCounts: Map<string, number>
): ProjectStats[] {
  return projects.map(project => {
    const id = String(project._id)
    const backlog = sum(issueRows, id, 'backlog')
    const inProgress = sum(issueRows, id, 'in_progress')
    const blocked = sum(issueRows, id, 'blocked')

    const planned = sum(featureRows, id, 'planned')
    const featureInProgress = sum(featureRows, id, 'in_progress')

    return {
      id,
      key: project.key,
      name: project.name,
      issues: {
        total: sum(issueRows, id),
        open: backlog + inProgress + blocked,
        backlog,
        inProgress,
        blocked,
        fixed: sum(issueRows, id, 'fixed'),
        wontFix: sum(issueRows, id, 'wont_fix'),
      },
      features: {
        total: sum(featureRows, id),
        active: planned + featureInProgress,
        proposed: sum(featureRows, id, 'proposed'),
        planned,
        inProgress: featureInProgress,
        shipped: sum(featureRows, id, 'shipped'),
        dropped: sum(featureRows, id, 'dropped'),
      },
      assets: assetCounts.get(id) ?? 0,
    }
  })
}

/** Number of assets linked to each project (an asset counts once per project it serves) */
export function countAssetsPerProject(assets: Array<{ projects?: Array<{ projectId: unknown }> }>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const asset of assets) {
    const seen = new Set((asset.projects ?? []).map(p => String(p.projectId)))
    seen.forEach(id => counts.set(id, (counts.get(id) ?? 0) + 1))
  }
  return counts
}
