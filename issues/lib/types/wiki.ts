import { ObjectId } from 'mongodb'

export interface WikiPage {
  _id?: ObjectId
  title: string
  slug: string
  content: string
  summary?: string
  authorId: ObjectId
  tags: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  lastEditedBy?: ObjectId
  version: number
}

export interface CreateWikiData {
  title: string
  content: string
  summary?: string
  tags: string[]
  isPublished?: boolean
}

export interface UpdateWikiData {
  title?: string
  content?: string
  summary?: string
  tags?: string[]
  isPublished?: boolean
}

export interface WikiPageWithAuthor extends WikiPage {
  author: {
    _id: ObjectId
    name: string
    email: string
  }
  lastEditor?: {
    _id: ObjectId
    name: string
    email: string
  }
}

export interface WikiSearchResult {
  _id: ObjectId
  title: string
  slug: string
  summary?: string
  content: string
  tags: string[]
  author: {
    _id: ObjectId
    name: string
    email: string
  }
  updatedAt: Date
  score?: number
}

export interface WikiFilter {
  tags?: string[]
  authorId?: string
  isPublished?: boolean
  search?: string
}