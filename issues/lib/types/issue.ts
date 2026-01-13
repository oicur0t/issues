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
}

export interface CreateIssueData {
  projectId: string
  title: string
  description: string
  priority: IssuePriority
  assigneeId?: string
  tags: string[]
  dueDate?: Date
}

export interface UpdateIssueData {
  title?: string
  description?: string
  status?: IssueStatus
  priority?: IssuePriority
  assigneeId?: string
  tags?: string[]
  dueDate?: Date
}

export interface IssueFilter {
  projectId?: string
  status?: IssueStatus[]
  priority?: IssuePriority[]
  assigneeId?: string
  reporterId?: string
  tags?: string[]
  search?: string
}

export interface IssueWithAssignee extends Issue {
  project: {
    _id: ObjectId
    name: string
    key: string
  }
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