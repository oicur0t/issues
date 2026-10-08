/**
 * Pure Tailscale -> asset sync planning. No I/O, so it can be tested without a network or database.
 *
 * Field ownership: the sync owns ONLY the `tailscale` subdocument (plus status 'removed' and
 * removedAt). Manual fields (provider, location, notes, tags, accounts, projects) are never touched.
 */
import type { AssetWarning, TailscaleInfo } from './types/asset'

/** Subset of the Tailscale device object we use (field names verified against the official client) */
export interface TailscaleDevice {
  id?: string
  nodeId: string
  name: string // MagicDNS FQDN
  hostname: string
  addresses: string[]
  os?: string
  clientVersion?: string
  updateAvailable?: boolean
  authorized?: boolean
  user?: string
  tags?: string[]
  isExternal?: boolean
  connectedToControl?: boolean
  lastSeen?: string | null // null/absent while connected
  created?: string | null
  expires?: string | null // zero time when key expiry is disabled
  keyExpiryDisabled?: boolean
}

/** Minimal view of an existing asset document */
export interface ExistingAsset {
  _id: unknown
  name: string
  type?: string
  status: string
  hostname?: string
  ipAddresses?: string[]
  tailscale?: { nodeId?: string } | null
}

export interface SyncConfig {
  expiryWarnDays: number
  offlineHours: number
}

export interface NewAssetDoc {
  name: string
  hostname: string
  ipAddresses: string[]
  type: 'host'
  status: 'active'
  os?: string
  provider?: string // left empty on purpose: manual field
  location?: string // left empty on purpose: manual field
  accounts: never[]
  projects: never[]
  tags: string[]
  needsReview: true
  createdBy: unknown
  createdAt: Date
  updatedAt: Date
  tailscale: TailscaleInfo
}

export interface AssetUpdate {
  assetId: unknown
  tailscale: TailscaleInfo
  adopted: boolean // an existing manual asset was linked to its device for the first time
  reactivate: boolean // asset was 'removed' and its device is back
}

export interface SyncPlan {
  aborted?: string
  inserts: NewAssetDoc[]
  updates: AssetUpdate[]
  removals: unknown[] // asset ids to mark removed
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

/** Tailscale uses the zero time for "no expiry"; treat anything before 2000 as unset */
function parseTime(value?: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2000) return null
  return date
}

export function computeWarnings(device: TailscaleDevice, now: Date, cfg: SyncConfig): AssetWarning[] {
  const warnings: AssetWarning[] = []

  if (device.authorized === false) {
    warnings.push({ code: 'unauthorized', message: 'Device is not authorized on the tailnet' })
  }

  const expires = parseTime(device.expires)
  if (!device.keyExpiryDisabled && expires) {
    if (expires.getTime() <= now.getTime()) {
      warnings.push({ code: 'key_expired', message: `Node key expired on ${expires.toISOString().slice(0, 10)}` })
    } else if (expires.getTime() - now.getTime() <= cfg.expiryWarnDays * DAY_MS) {
      const days = Math.ceil((expires.getTime() - now.getTime()) / DAY_MS)
      warnings.push({ code: 'key_expiring', message: `Node key expires in ${days} day${days === 1 ? '' : 's'}` })
    }
  }

  const lastSeen = parseTime(device.lastSeen)
  if (device.connectedToControl !== true && lastSeen && now.getTime() - lastSeen.getTime() > cfg.offlineHours * HOUR_MS) {
    warnings.push({ code: 'offline', message: `Offline since ${lastSeen.toISOString().slice(0, 16).replace('T', ' ')} UTC` })
  }

  if (device.updateAvailable) {
    warnings.push({ code: 'update_available', message: 'Tailscale client update available' })
  }

  return warnings
}

export function toTailscaleInfo(device: TailscaleDevice, now: Date, cfg: SyncConfig): TailscaleInfo {
  return {
    nodeId: device.nodeId,
    deviceId: device.id,
    name: device.name,
    hostname: device.hostname,
    addresses: device.addresses ?? [],
    os: device.os,
    clientVersion: device.clientVersion,
    updateAvailable: !!device.updateAvailable,
    authorized: device.authorized !== false,
    user: device.user,
    tags: device.tags ?? [],
    isExternal: !!device.isExternal,
    connectedToControl: device.connectedToControl,
    lastSeen: parseTime(device.lastSeen),
    created: parseTime(device.created),
    expires: device.keyExpiryDisabled ? null : parseTime(device.expires),
    keyExpiryDisabled: !!device.keyExpiryDisabled,
    lastSyncedAt: now,
    warnings: computeWarnings(device, now, cfg),
  }
}

const lower = (s?: string) => (s ?? '').toLowerCase()

function assetName(device: TailscaleDevice): string {
  const label = device.name.split('.')[0]
  return device.hostname && lower(device.hostname) !== 'localhost' ? device.hostname : label
}

function matchesByAddressOrHostname(asset: ExistingAsset, device: TailscaleDevice): boolean {
  const addresses = new Set((device.addresses ?? []).map(lower))
  if ((asset.ipAddresses ?? []).some(ip => addresses.has(lower(ip)))) return true

  const assetHost = lower(asset.hostname)
  return !!assetHost && (assetHost === lower(device.name) || assetHost === lower(device.hostname))
}

/**
 * Decide what a sync run should write. Never mutates its inputs.
 *
 * Matching order for each device: (1) asset already linked by nodeId, (2) unlinked asset sharing
 * an IP or hostname (adoption, so existing manual assets are not duplicated), (3) otherwise insert.
 */
export function planSync(
  assets: ExistingAsset[],
  devices: TailscaleDevice[],
  now: Date,
  cfg: SyncConfig,
  createdBy: unknown
): SyncPlan {
  const plan: SyncPlan = { inserts: [], updates: [], removals: [] }

  const known = assets.filter(a => a.tailscale?.nodeId)

  // An empty answer while we know of linked devices is far more likely an API problem than a wiped tailnet
  if (devices.length === 0) {
    if (known.length > 0) {
      plan.aborted = `Tailscale returned no devices but ${known.length} linked assets exist; refusing to mark them removed`
    }
    return plan
  }

  const byNodeId = new Map(known.map(a => [a.tailscale!.nodeId!, a]))
  const unlinked = assets.filter(a => !a.tailscale?.nodeId)
  const claimed = new Set<unknown>()
  const presentNodeIds = new Set(devices.map(d => d.nodeId))

  for (const device of devices) {
    const info = toTailscaleInfo(device, now, cfg)

    const linked = byNodeId.get(device.nodeId)
    if (linked && !claimed.has(linked._id)) {
      claimed.add(linked._id)
      plan.updates.push({ assetId: linked._id, tailscale: info, adopted: false, reactivate: linked.status === 'removed' })
      continue
    }

    const adoptee = unlinked.find(a => !claimed.has(a._id) && matchesByAddressOrHostname(a, device))
    if (adoptee) {
      claimed.add(adoptee._id)
      plan.updates.push({ assetId: adoptee._id, tailscale: info, adopted: true, reactivate: false })
      continue
    }

    plan.inserts.push({
      // iOS (and some others) report the hostname "localhost"; the MagicDNS label is unique and meaningful
      name: assetName(device),
      hostname: device.name,
      ipAddresses: device.addresses ?? [],
      type: 'host',
      status: 'active',
      os: device.os,
      accounts: [],
      projects: [],
      tags: ['tailscale'],
      needsReview: true,
      createdBy,
      createdAt: now,
      updatedAt: now,
      tailscale: info,
    })
  }

  for (const asset of known) {
    if (presentNodeIds.has(asset.tailscale!.nodeId!)) continue
    if (asset.status === 'removed' || asset.status === 'decommissioned') continue
    plan.removals.push(asset._id)
  }

  if (known.length > 0 && plan.removals.length / known.length > 0.5) {
    return {
      aborted: `Sync would mark ${plan.removals.length} of ${known.length} linked assets removed (more than half); refusing. Check the Tailscale credentials and tailnet.`,
      inserts: [],
      updates: [],
      removals: [],
    }
  }

  return plan
}
