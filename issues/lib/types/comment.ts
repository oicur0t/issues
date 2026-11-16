import { ObjectId } from 'mongodb'

export interface Comment {
  _id?: ObjectId
  // Exactly one of issueId / featureId is set
  issueId?: ObjectId
  featureId?: ObjectId
  authorId: ObjectId
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCommentData {
  issueId: string
  content: string
}

export interface CreateFeatureCommentData {
  featureId: string // ObjectId or feature number (e.g. CUS-F001)
  content: string
}

export interface UpdateCommentData {
  content: string
}
