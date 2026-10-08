import { ObjectId } from 'mongodb'

// 'removed' is set by the Tailscale sync when a device disappears from the tailnet
export type AssetStatus = 'active' | 'maintenance' | 'decommissioned' | 'removed'

export type AssetWarningCode =
  | 'key_expired'
  | 'key_expiring'
  | 'offline'
  | 'update_available'
  | 'unauthorized'

export interface AssetWarning {
  code: AssetWarningCode
  message: string
}

/**
 * Owned by the Tailscale sync: overwritten on every run. Never edited by hand.
 */
export interface TailscaleInfo {
  nodeId: string // stable key; hostnames change
  deviceId?: string // legacy id
  name: string // MagicDNS FQDN, e.g. wopr.tail6fe843.ts.net
  hostname: string
  addresses: string[]
  os?: string
  clientVersion?: string
  updateAvailable: boolean
  authorized: boolean
  user?: string
  tags: string[]
  isExternal: boolean
  connectedToControl?: boolean
  lastSeen: Date | null // null when currently connected
  created: Date | null
  expires: Date | null // null when key expiry is disabled
  keyExpiryDisabled: boolean
  lastSyncedAt: Date
  warnings: AssetWarning[]
}

export interface AssetAccount {
  key: string   // e.g., "SSH User", "Admin Account", "API Key"
  value: string // e.g., "root", "admin@example.com"
}

export interface AssetProject {
  projectId: ObjectId
  role: string // Role this asset plays for this project
}

export interface AssetSystemInfo {
  osVersion?: string
  kernel?: string
  architecture?: string
  cpuModel?: string
  cpuCores?: number
  totalMemory?: string
  diskSpace?: string
  uptime?: string
}

export interface Asset {
  _id?: ObjectId
  name: string // e.g., "production-web-01"
  hostname?: string
  ipAddresses: string[] // Can have multiple IPs
  type: string // Flexible type using tags instead of enum
  status: AssetStatus
  os?: string // Operating system
  provider?: string // e.g., "AWS", "DigitalOcean", "On-Prem"
  location?: string // e.g., "us-east-1", "Toronto DC"
  cost?: number // Monthly/annual cost
  vendorUrl?: string // Link to vendor/provider portal
  accounts: AssetAccount[] // Key-value pairs for accounts
  description?: string // Additional notes
  projects: AssetProject[] // Many-to-many with roles
  tags: string[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
  lastCheckIn?: Date // Last time this asset checked in via phone-home
  systemInfo?: AssetSystemInfo // Detailed system information from phone-home
  tailscale?: TailscaleInfo // Owned by the Tailscale sync
  removedAt?: Date // Set when the sync marks the asset removed
  needsReview?: boolean // Created by the sync; manual fields still empty
}

export interface CreateAssetData {
  name: string
  hostname?: string
  ipAddresses: string[]
  type: string
  status: AssetStatus
  os?: string
  provider?: string
  location?: string
  cost?: number
  vendorUrl?: string
  accounts: AssetAccount[]
  description?: string
  projects: Array<{ projectId: string; role: string }> // String IDs from form
  tags: string[]
}

export interface UpdateAssetData {
  name?: string
  hostname?: string
  ipAddresses?: string[]
  type?: string
  status?: AssetStatus
  os?: string
  provider?: string
  location?: string
  cost?: number
  vendorUrl?: string
  accounts?: AssetAccount[]
  description?: string
  projects?: Array<{ projectId: string; role: string }>
  tags?: string[]
}

export interface AssetFilter {
  type?: string[]
  status?: AssetStatus[]
  projectId?: string
  tags?: string[]
  search?: string
  provider?: string
  location?: string
}

export interface AssetWithProjects extends Omit<Asset, 'projects'> {
  projects: Array<{
    _id: ObjectId
    name: string
    key: string
    role: string
  }>
  creator: {
    _id: ObjectId
    name: string
    email: string
  }
}
