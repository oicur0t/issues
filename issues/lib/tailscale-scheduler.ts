/**
 * In-process scheduler for the Tailscale sync. Started once from instrumentation.ts.
 * Does nothing unless OAuth credentials are configured and the interval is > 0.
 */
import { getCollection } from './mongodb'
import { getTailscaleConfig, runTailscaleSync } from './tailscale-runner'

const FIRST_RUN_DELAY_MS = 30_000

const globalState = globalThis as typeof globalThis & { __tailscaleSchedulerStarted?: boolean }

async function runOnce() {
  try {
    // Attribute auto-discovered assets to the earliest admin account
    const users = await getCollection('users')
    const admin = await users.findOne({ role: 'admin' }, { sort: { createdAt: 1 } })
    if (!admin) {
      console.warn('[tailscale] No admin user found; skipping scheduled sync')
      return
    }
    const summary = await runTailscaleSync(admin._id)
    console.log('[tailscale] Scheduled sync complete:', JSON.stringify(summary))
  } catch (error) {
    // State (including the error) is already recorded by the runner
    console.error('[tailscale] Scheduled sync failed:', error instanceof Error ? error.message : error)
  }
}

export function startTailscaleScheduler() {
  if (globalState.__tailscaleSchedulerStarted) return

  const config = getTailscaleConfig()
  if (!config.configured) {
    console.log('[tailscale] Not configured; scheduled sync disabled')
    return
  }
  if (config.intervalMinutes <= 0) {
    console.log('[tailscale] TAILSCALE_SYNC_INTERVAL_MINUTES is 0; scheduled sync disabled')
    return
  }

  globalState.__tailscaleSchedulerStarted = true
  console.log(`[tailscale] Scheduled sync every ${config.intervalMinutes} minutes`)

  setTimeout(() => {
    void runOnce()
    setInterval(() => void runOnce(), config.intervalMinutes * 60_000)
  }, FIRST_RUN_DELAY_MS)
}
