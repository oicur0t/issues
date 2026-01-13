import { ObjectId } from 'mongodb'

export type AssetStatus = 'active' | 'maintenance' | 'decommissioned'

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
