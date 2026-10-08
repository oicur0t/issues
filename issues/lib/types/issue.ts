import { ObjectId } from 'mongodb'

export type IssueStatus = 'backlog' | 'in_progress' | 'blocked' | 'fixed' | 'wont_fix'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'

export interface Issue {
  _id?: ObjectId
  projectId: ObjectId
  issueNumber: string // e.g., "CUS-001"
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  assigneeId?: ObjectId
  reporterId: ObjectId
  tags: string[]
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  featureId?: ObjectId
  claimedBy?: ObjectId // user currently working on this issue (see claim-actions)
  claimedAt?: Date // claims expire after CLAIM_TTL_HOURS
}

export interface CreateIssueData {
  projectId: string
  title: string
  description: string
  priority: IssuePriority
  assigneeId?: string
  tags: string[]
  dueDate?: Date
  featureId?: string
}

export interface UpdateIssueData {
  title?: string
  description?: string
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: string | null // null unassigns
  tags?: string[]
  dueDate?: Date
  featureId?: string | null
}

export interface IssueFilter {
  projectId?: string
  status?: IssueStatus[]
  priority?: IssuePriority[]
  assigneeId?: string
  reporterId?: string
  featureId?: string
  tags?: string[]
  search?: string
}

export interface IssueWithAssignee extends Issue {
  project: {
    _id: ObjectId
    name: string
    key: string
  }
  feature?: {
    _id: ObjectId
    featureNumber: string
    title: string
  }
  claimer?: {
    _id: ObjectId
    name: string
    email: string
  }
  claimExpired?: boolean // claim exists but has passed its TTL
  assignee?: {
    _id: ObjectId
    name: string
    email: string
  }
  reporter: {
    _id: ObjectId
    name: string
    email: string
  }
}