'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireUnifiedAuth } from '@/lib/unified-auth'
import { Comment, CreateCommentData, UpdateCommentData } from '@/lib/types'
import { isEmptyOrWhitespace } from '@/lib/utils'
import { isApiAuthError } from '@/lib/api-errors'

/**
 * Creates a new comment on an issue
 */
export async function createComment(data: CreateCommentData): Promise<Comment> {
  try {
    const user = await requireUnifiedAuth('viewer')

    // Validate input
    if (isEmptyOrWhitespace(data.content)) {
      throw new Error('Comment content is required')
    }

    if (!ObjectId.isValid(data.issueId)) {
      throw new Error('Invalid issue ID')
    }

    const commentsCollection = await getCollection('comments')
    const issuesCollection = await getCollection('issues')

    // Verify issue exists
    const issue = await issuesCollection.findOne({ _id: new ObjectId(data.issueId) })
    if (!issue) {
      throw new Error('Issue not found')
    }

    const newComment: Omit<Comment, '_id'> = {
      issueId: new ObjectId(data.issueId),
      authorId: user._id,
      content: data.content.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await commentsCollection.insertOne(newComment)

    revalidatePath(`/issues/${data.issueId}`)

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
    console.error('Error creating comment:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to create comment')
  }
}

/**
 * Gets all comments for an issue
 */
export async function getComments(issueId: string): Promise<Comment[]> {
  try {
    await requireUnifiedAuth('viewer')

    if (!ObjectId.isValid(issueId)) {
      throw new Error('Invalid issue ID')
    }

    const commentsCollection = await getCollection('comments')
    const usersCollection = await getCollection('users')

    const comments = await commentsCollection
      .find({ issueId: new ObjectId(issueId) })
      .sort({ createdAt: 1 })
      .toArray()

    // Get unique author IDs
    const authorIds = [...new Set(comments.map(c => c.authorId.toString()))]

    // Fetch all authors
    const authors = await usersCollection
      .find({ _id: { $in: authorIds.map(id => new ObjectId(id)) } })
      .toArray()

    const authorsMap = new Map(authors.map(a => [a._id.toString(), a]))

    // Attach author info to comments
    return comments.map(comment => ({
      ...comment,
      author: authorsMap.get(comment.authorId.toString()) || {
        _id: new ObjectId(),
        name: 'Unknown User',
        email: 'unknown@example.com',
      },
    })) as any
  } catch (error) {
    console.error('Error getting comments:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get comments')
  }
}

/**
 * Updates a comment
 */
export async function updateComment(commentId: string, data: UpdateCommentData): Promise<Comment> {
  try {
    const user = await requireUnifiedAuth('viewer')

    if (!ObjectId.isValid(commentId)) {
      throw new Error('Invalid comment ID')
    }

    if (isEmptyOrWhitespace(data.content)) {
      throw new Error('Comment content is required')
    }

    const commentsCollection = await getCollection('comments')

    const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) })
    if (!comment) {
      throw new Error('Comment not found')
    }

    // Only author can update their own comment (or admin)
    if (comment.authorId.toString() !== user._id.toString() && user.role !== 'admin') {
      throw new Error('You can only edit your own comments')
    }

    const updatedComment = await commentsCollection.findOneAndUpdate(
      { _id: new ObjectId(commentId) },
      {
        $set: {
          content: data.content.trim(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!updatedComment) {
      throw new Error('Comment not found')
    }

    revalidatePath(`/issues/${updatedComment.issueId.toString()}`)

    return updatedComment as Comment
  } catch (error) {
    console.error('Error updating comment:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to update comment')
  }
}

/**
 * Deletes a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  try {
    const user = await requireUnifiedAuth('viewer')

    if (!ObjectId.isValid(commentId)) {
      throw new Error('Invalid comment ID')
    }

    const commentsCollection = await getCollection('comments')

    const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) })
    if (!comment) {
      throw new Error('Comment not found')
    }

    // Only author can delete their own comment (or admin)
    if (comment.authorId.toString() !== user._id.toString() && user.role !== 'admin') {
      throw new Error('You can only delete your own comments')
    }

    const issueId = comment.issueId.toString()

    await commentsCollection.deleteOne({ _id: new ObjectId(commentId) })

    revalidatePath(`/issues/${issueId}`)
  } catch (error) {
    console.error('Error deleting comment:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to delete comment')
  }
}
