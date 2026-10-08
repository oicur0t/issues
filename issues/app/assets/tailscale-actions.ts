'use server'

import { revalidatePath } from 'next/cache'
import { requireUnifiedAuth as requireAuth } from '@/lib/unified-auth'
import { isApiAuthError } from '@/lib/api-errors'
import {
  getTailscaleConfig,
  getTailscaleSyncState,
  runTailscaleSync,
  type TailscaleSyncState,
  type TailscaleSyncSummary,
} from '@/lib/tailscale-runner'

export interface TailscaleStatus extends TailscaleSyncState {
  configured: boolean
  intervalMinutes: number
}

/**
 * Gets whether the Tailscale sync is configured and how the last run went
 */
export async function getTailscaleStatus(): Promise<TailscaleStatus> {
  try {
    await requireAuth('viewer')
    const config = getTailscaleConfig()
    return {
      configured: config.configured,
      intervalMinutes: config.intervalMinutes,
      ...(await getTailscaleSyncState()),
    }
  } catch (error) {
    console.error('Error getting Tailscale status:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get Tailscale status')
  }
}

export type TailscaleSyncResult =
  | { ok: true; summary: TailscaleSyncSummary }
  | { ok: false; error: string; status: number }

/**
 * Runs a Tailscale sync now. Newly discovered assets are attributed to the caller.
 * Expected failures (not configured, Tailscale rejected us, safety guard) are returned,
 * not thrown: production Next.js masks thrown messages, and these are the ones users need to read.
 */
export async function syncTailscaleNow(): Promise<TailscaleSyncResult> {
  try {
    const user = await requireAuth('developer')

    if (!getTailscaleConfig().configured) {
      return {
        ok: false,
        status: 400,
        error: 'Tailscale sync is not configured: set TAILSCALE_OAUTH_CLIENT_ID and TAILSCALE_OAUTH_CLIENT_SECRET',
      }
    }

    const summary = await runTailscaleSync(user._id)

    revalidatePath('/assets')
    revalidatePath('/')

    return { ok: true, summary }
  } catch (error) {
    if (error instanceof Error && error.name === 'TailscaleError') {
      return { ok: false, status: 502, error: error.message }
    }
    console.error('Error syncing Tailscale:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Tailscale sync failed')
  }
}
