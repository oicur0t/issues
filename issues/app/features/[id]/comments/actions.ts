'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireUnifiedAuth } from '@/lib/unified-auth'
import { Comment, CreateFeatureCommentData } from '@/lib/types'
import { isEmptyOrWhitespace } from '@/lib/utils'
import { isApiAuthError } from '@/lib/api-errors'

function wrapError(error: unknown, fallback: string): Error {
  return isApiAuthError(error) ? (error as Error) : new Error(error instanceof Error ? error.message : fallback)
}

/** Resolves an ObjectId or feature number (e.g. CUS-F001) to the feature's ObjectId */
async function resolveFeatureId(id: string): Promise<ObjectId> {
  const featuresCollection = await getCollection('features')
  const feature = await featuresCollection.findOne(
    ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { featureNumber: id },
    { projection: { _id: 1 } }
  )
  if (!feature) {
    throw new Error('Feature not found')
  }
  return feature._id as ObjectId
}

/**
 * Creates a new comment on a feature
 */
export async function createFeatureComment(data: CreateFeatureCommentData): Promise<Comment> {
  try {
    const user = await requireUnifiedAuth('viewer')

    if (isEmptyOrWhitespace(data.content)) {
      throw new Error('Comment content is required')
    }

    const featureId = await resolveFeatureId(data.featureId)
    const commentsCollection = await getCollection('comments')

    const now = new Date()
    const newComment: Omit<Comment, '_id'> = {
      featureId,
      authorId: user._id,
      content: data.content.trim(),
      createdAt: now,
      updatedAt: now,
    }

    const result = await commentsCollection.insertOne(newComment)

    revalidatePath(`/features/${featureId.toString()}`)

    return {
      _id: result.insertedId,
      ...newComment,
      author: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    } as any
  } catch (error) {
    console.error('Error creating feature comment:', error)
    throw wrapError(error, 'Failed to create comment')
  }
}

/**
 * Gets all comments for a feature, oldest first
 */
export async function getFeatureComments(id: string): Promise<Comment[]> {
  try {
    await requireUnifiedAuth('viewer')

    const featureId = await resolveFeatureId(id)
    const commentsCollection = await getCollection('comments')
    const usersCollection = await getCollection('users')

    const comments = await commentsCollection.find({ featureId }).sort({ createdAt: 1 }).toArray()

    const authorIds = [...new Set(comments.map(c => c.authorId.toString()))]
    const authors = await usersCollection
      .find({ _id: { $in: authorIds.map(authorId => new ObjectId(authorId)) } })
      .toArray()
    const authorsMap = new Map(authors.map(a => [a._id.toString(), a]))

    return comments.map(comment => {
      const author = authorsMap.get(comment.authorId.toString())
      return {
        ...comment,
        author: author
          ? { _id: author._id, name: author.name, email: author.email }
          : { _id: new ObjectId(), name: 'Unknown User', email: 'unknown@example.com' },
      }
    }) as any
  } catch (error) {
    console.error('Error getting feature comments:', error)
    throw wrapError(error, 'Failed to get comments')
  }
}
