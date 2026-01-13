import { ObjectId } from 'mongodb'

export interface Project {
  _id?: ObjectId
  name: string
  key: string // e.g., "CUS" for Customer Portal
  description: string
  createdAt: Date
  updatedAt: Date
  createdBy: ObjectId
  issueCounter: number // Counter for generating issue numbers
}

export interface CreateProjectData {
  name: string
  key: string
  description: string
}

export interface UpdateProjectData {
  name?: string
  key?: string
  description?: string
}

export interface ProjectWithCreator extends Project {
  creator: {
    _id: ObjectId
    name: string
    email: string
  }
}
