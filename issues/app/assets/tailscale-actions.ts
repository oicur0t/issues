'use server'

import { revalidatePath } from 'next/cache'
import { requireUnifiedAuth as requireAuth } from '@/lib/unified-auth'
import { ApiAuthError, isApiAuthError } from '@/lib/api-errors'
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

/**
 * Runs a Tailscale sync now. Newly discovered assets are attributed to the caller.
 */
export async function syncTailscaleNow(): Promise<TailscaleSyncSummary> {
  try {
    const user = await requireAuth('developer')

    if (!getTailscaleConfig().configured) {
      // 400: nothing the server can do until credentials are set
      throw new ApiAuthError('Tailscale sync is not configured: set TAILSCALE_OAUTH_CLIENT_ID and TAILSCALE_OAUTH_CLIENT_SECRET', 400)
    }

    const summary = await runTailscaleSync(user._id)

    revalidatePath('/assets')
    revalidatePath('/')

    return summary
  } catch (error) {
    console.error('Error syncing Tailscale:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Tailscale sync failed')
  }
}
