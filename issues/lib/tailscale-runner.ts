/**
 * Runs a Tailscale -> assets sync against the database. No authentication here: callers
 * (server action, API route, scheduler) are responsible for who may trigger it.
 *
 * A failed run (bad credentials, API down, safety guard tripped) writes NOTHING to assets.
 */
import { ObjectId } from 'mongodb'
import { getCollection } from './mongodb'
import { fetchDevices, getAccessToken, TailscaleError } from './tailscale-client'
import { planSync, type ExistingAsset, type SyncConfig } from './tailscale-sync'

export interface TailscaleSyncSummary {
  devices: number
  added: number
  adopted: number
  updated: number
  reactivated: number
  removed: number
  withWarnings: number
}

export interface TailscaleSyncState {
  lastAttemptAt?: Date
  lastSuccessAt?: Date
  lastError?: string | null
  summary?: TailscaleSyncSummary
}

export interface TailscaleConfig {
  configured: boolean
  clientId?: string
  clientSecret?: string
  intervalMinutes: number
  sync: SyncConfig
}

const STATE_ID = 'tailscale'

function positiveNumber(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && value !== undefined && value !== '' ? n : fallback
}

export function getTailscaleConfig(): TailscaleConfig {
  const clientId = process.env.TAILSCALE_OAUTH_CLIENT_ID?.trim()
  const clientSecret = process.env.TAILSCALE_OAUTH_CLIENT_SECRET?.trim()
  return {
    configured: !!clientId && !!clientSecret,
    clientId,
    clientSecret,
    intervalMinutes: positiveNumber(process.env.TAILSCALE_SYNC_INTERVAL_MINUTES, 60),
    sync: {
      expiryWarnDays: positiveNumber(process.env.TAILSCALE_KEY_EXPIRY_WARN_DAYS, 14),
      offlineHours: positiveNumber(process.env.TAILSCALE_OFFLINE_HOURS, 24),
    },
  }
}

export async function getTailscaleSyncState(): Promise<TailscaleSyncState> {
  const states = await getCollection('sync_state')
  const doc = await states.findOne({ _id: STATE_ID as any })
  if (!doc) return {}
  return {
    lastAttemptAt: doc.lastAttemptAt,
    lastSuccessAt: doc.lastSuccessAt,
    lastError: doc.lastError ?? null,
    summary: doc.summary,
  }
}

async function recordState(update: Record<string, unknown>) {
  const states = await getCollection('sync_state')
  await states.updateOne({ _id: STATE_ID as any }, { $set: update }, { upsert: true })
}

const globalState = globalThis as typeof globalThis & { __tailscaleSyncRunning?: boolean }

/**
 * @param createdBy user the sync attributes newly discovered assets to
 */
export async function runTailscaleSync(createdBy: ObjectId): Promise<TailscaleSyncSummary> {
  const config = getTailscaleConfig()
  if (!config.configured) {
    throw new TailscaleError('Tailscale sync is not configured: set TAILSCALE_OAUTH_CLIENT_ID and TAILSCALE_OAUTH_CLIENT_SECRET')
  }

  if (globalState.__tailscaleSyncRunning) {
    throw new TailscaleError('A Tailscale sync is already running')
  }
  globalState.__tailscaleSyncRunning = true

  const now = new Date()
  try {
    const token = await getAccessToken({ clientId: config.clientId!, clientSecret: config.clientSecret! })
    const devices = await fetchDevices(token)

    const assetsCollection = await getCollection('assets')
    const existing = (await assetsCollection
      .find({}, { projection: { name: 1, type: 1, status: 1, hostname: 1, ipAddresses: 1, 'tailscale.nodeId': 1 } })
      .toArray()) as unknown as ExistingAsset[]

    const plan = planSync(existing, devices, now, config.sync, createdBy)
    if (plan.aborted) {
      throw new TailscaleError(plan.aborted)
    }

    const operations: any[] = []
    for (const doc of plan.inserts) {
      operations.push({ insertOne: { document: doc } })
    }
    for (const update of plan.updates) {
      operations.push({
        updateOne: {
          filter: { _id: update.assetId },
          update: {
            $set: {
              tailscale: update.tailscale,
              updatedAt: now,
              ...(update.reactivate && { status: 'active' }),
            },
            ...(update.reactivate && { $unset: { removedAt: '' } }),
          },
        },
      })
    }
    if (plan.removals.length > 0) {
      operations.push({
        updateMany: {
          filter: { _id: { $in: plan.removals } },
          update: { $set: { status: 'removed', removedAt: now, updatedAt: now } },
        },
      })
    }
    if (operations.length > 0) {
      await assetsCollection.bulkWrite(operations, { ordered: false })
    }

    const summary: TailscaleSyncSummary = {
      devices: devices.length,
      added: plan.inserts.length,
      adopted: plan.updates.filter(u => u.adopted).length,
      updated: plan.updates.filter(u => !u.adopted && !u.reactivate).length,
      reactivated: plan.updates.filter(u => u.reactivate).length,
      removed: plan.removals.length,
      withWarnings:
        plan.updates.filter(u => u.tailscale.warnings.length > 0).length +
        plan.inserts.filter(i => i.tailscale.warnings.length > 0).length,
    }

    await recordState({ lastAttemptAt: now, lastSuccessAt: now, lastError: null, summary })
    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tailscale sync failed'
    await recordState({ lastAttemptAt: now, lastError: message }).catch(() => {})
    throw error
  } finally {
    globalState.__tailscaleSyncRunning = false
  }
}
