'use client'

import { FeatureStatus, FeatureProgress } from '@/lib/types'

export const featureStatusConfig: Record<FeatureStatus, { color: string; label: string }> = {
  proposed: { color: 'bg-gray-200', label: 'Proposed' },
  planned: { color: 'bg-blue-300', label: 'Planned' },
  in_progress: { color: 'bg-yellow-300', label: 'In Progress' },
  shipped: { color: 'bg-green-300', label: 'Shipped' },
  dropped: { color: 'bg-red-300', label: 'Dropped' },
}

export const featureStatuses = Object.keys(featureStatusConfig) as FeatureStatus[]

export function FeatureStatusBadge({ status }: { status: FeatureStatus }) {
  const cfg = featureStatusConfig[status]
  return (
    <div
      className={`inline-flex items-center px-3 py-1.5 ${cfg.color} border-2 border-black font-black text-sm`}
      style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
    >
      {cfg.label}
    </div>
  )
}

export function FeatureProgressBar({ progress }: { progress: FeatureProgress }) {
  return (
    <div>
      <div className="h-4 border-2 border-black bg-white">
        <div className="h-full bg-green-400" style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="text-xs font-bold text-muted-foreground mt-1">
        {progress.total === 0
          ? 'No linked issues'
          : `${progress.done}/${progress.total} issues done (${progress.percent}%)` +
            (progress.blocked ? ` · ${progress.blocked} blocked` : '')}
      </div>
    </div>
  )
}
