'use client'

import { AssetWarning } from '@/lib/types'
import { AlertTriangle } from 'lucide-react'

interface AssetWarningsProps {
  warnings?: AssetWarning[]
  max?: number
}

const warningColor: Record<AssetWarning['code'], string> = {
  key_expired: 'bg-red-300',
  key_expiring: 'bg-orange-300',
  offline: 'bg-yellow-300',
  update_available: 'bg-blue-200',
  unauthorized: 'bg-red-300',
}

/** Warning chips from the Tailscale sync (key expiry, offline, update available) */
export function AssetWarnings({ warnings, max }: Readonly<AssetWarningsProps>) {
  if (!warnings || warnings.length === 0) return null

  const shown = max ? warnings.slice(0, max) : warnings
  const hidden = warnings.length - shown.length

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(w => (
        <span
          key={w.code}
          title={w.message}
          className={`inline-flex items-center gap-1 px-2 py-0.5 ${warningColor[w.code]} border-2 border-black text-xs font-bold`}
        >
          <AlertTriangle className="h-3 w-3" />
          {w.message}
        </span>
      ))}
      {hidden > 0 && <span className="text-xs font-bold text-muted-foreground">+{hidden} more</span>}
    </div>
  )
}
