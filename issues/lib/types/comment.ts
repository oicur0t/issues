import { ObjectId } from 'mongodb'

export interface Comment {
  _id?: ObjectId
  issueId: ObjectId
  authorId: ObjectId
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCommentData {
  issueId: string
  content: string
}

export interface UpdateCommentData {
  content: string
}
