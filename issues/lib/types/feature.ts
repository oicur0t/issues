import { ObjectId } from 'mongodb'
import { IssuePriority } from './issue'

export type FeatureStatus = 'proposed' | 'planned' | 'in_progress' | 'shipped' | 'dropped'
export type FeaturePriority = IssuePriority

export interface Feature {
  _id?: ObjectId
  projectId: ObjectId
  featureNumber: string // e.g., "CUS-F001"
  title: string
  description: string // markdown: problem, desired behaviour
  acceptanceCriteria: string // markdown checklist
  status: FeatureStatus
  priority: FeaturePriority
  ownerId?: ObjectId
  wikiSlug?: string // optional link to a design/spec wiki page
  tags: string[]
  targetDate?: Date
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
  shippedAt?: Date // set automatically when status becomes shipped
}

export interface CreateFeatureData {
  projectId: string
  title: string
  description: string
  acceptanceCriteria?: string
  status?: FeatureStatus
  priority?: FeaturePriority
  ownerId?: string
  wikiSlug?: string
  tags?: string[]
  targetDate?: Date
}

export interface UpdateFeatureData {
  title?: string
  description?: string
  acceptanceCriteria?: string
  status?: FeatureStatus
  priority?: FeaturePriority
  ownerId?: string | null
  wikiSlug?: string
  tags?: string[]
  targetDate?: Date | null
}

export interface FeatureFilter {
  projectId?: string
  status?: FeatureStatus[]
  priority?: FeaturePriority[]
  ownerId?: string
  tags?: string[]
  search?: string
}

export interface FeatureProgress {
  total: number // linked issues excluding wont_fix
  done: number // fixed
  inProgress: number
  blocked: number
  percent: number
}

export interface FeatureWithDetails extends Feature {
  project: {
    _id: ObjectId
    name: string
    key: string
  }
  owner?: {
    _id: ObjectId
    name: string
    email: string
  }
  creator: {
    _id: ObjectId
    name: string
    email: string
  }
  progress: FeatureProgress
  warnings?: string[]
}
