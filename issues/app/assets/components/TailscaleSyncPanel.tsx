'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/components/UserProvider'
import { LocalDate } from '@/app/components/LocalDate'
import { Button } from '@/components/ui/button'
import { getTailscaleStatus, syncTailscaleNow, type TailscaleStatus } from '../tailscale-actions'
import { RefreshCw } from 'lucide-react'

/** Shows the Tailscale sync state and lets developers run it on demand */
export function TailscaleSyncPanel() {
  const router = useRouter()
  const { session } = useUser()
  const [status, setStatus] = useState<TailscaleStatus | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const role = session?.user.role
  const canSync = role === 'admin' || role === 'developer'

  const load = useCallback(async () => {
    try {
      setStatus(await getTailscaleStatus())
    } catch {
      // The panel is informational; the assets list shows its own errors
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSync = () => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const outcome = await syncTailscaleNow()
        if (outcome.ok) {
          const s = outcome.summary
          setResult(
            `${s.devices} devices: ${s.added} added, ${s.adopted} linked, ${s.updated} updated, ` +
              `${s.reactivated} reactivated, ${s.removed} removed`
          )
          router.refresh()
        } else {
          setError(outcome.error)
        }
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sync failed')
        await load()
      }
    })
  }

  if (!status) return null

  return (
    <div className="border-4 border-black bg-white p-4 flex items-center justify-between gap-4 flex-wrap" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
      <div className="space-y-1 min-w-0">
        <div className="font-black uppercase text-sm">Tailscale sync</div>
        {status.configured ? (
          <div className="text-sm font-bold text-muted-foreground">
            {status.lastSuccessAt ? (
              <>Last synced <LocalDate date={status.lastSuccessAt} /></>
            ) : (
              'Never synced'
            )}
            {status.intervalMinutes > 0 && ` · automatic every ${status.intervalMinutes} min`}
          </div>
        ) : (
          <div className="text-sm font-bold text-muted-foreground">
            Not configured. Set TAILSCALE_OAUTH_CLIENT_ID and TAILSCALE_OAUTH_CLIENT_SECRET to discover hosts automatically.
          </div>
        )}
        {status.lastError && (
          <div className="text-sm font-bold text-destructive">Last attempt failed: {status.lastError}</div>
        )}
        {error && <div className="text-sm font-bold text-destructive">{error}</div>}
        {result && <div className="text-sm font-bold">{result}</div>}
      </div>

      {status.configured && canSync && (
        <Button className="btn-primary" onClick={handleSync} disabled={isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          {isPending ? 'Syncing...' : 'Sync now'}
        </Button>
      )}
    </div>
  )
}
