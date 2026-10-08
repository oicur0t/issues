'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireUnifiedAuth as requireAuth } from '@/lib/unified-auth'
import { ApiAuthError, isApiAuthError } from '@/lib/api-errors'
import { IssueWithAssignee } from '@/lib/types'
import { CLAIM_TTL_HOURS, claimCutoff } from '@/lib/claims'
import { getIssue } from './actions'

function issueQuery(id: string) {
  return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { issueNumber: id }
}

// Reuses ApiAuthError so handleApiError maps it to its status (409 = claim conflict)
function conflict(message: string): ApiAuthError {
  return new ApiAuthError(message, 409)
}

function wrapError(error: unknown, fallback: string): Error {
  return isApiAuthError(error) ? (error as Error) : new Error(error instanceof Error ? error.message : fallback)
}

/**
 * Atomically claims an issue for the current user.
 * Succeeds if the issue is unclaimed, already claimed by you (refreshes the claim),
 * or the previous claim has expired. Also moves a backlog issue to in_progress and
 * assigns it to you if it has no assignee.
 */
async function claimForUser(filter: any, userId: ObjectId) {
  const issuesCollection = await getCollection('issues')
  const now = new Date()

  // Taking over from a different (expired) claimer reassigns the issue to the new claimer
  const takingOver = {
    $and: [{ $ne: [{ $type: '$claimedBy' }, 'missing'] }, { $ne: ['$claimedBy', userId] }],
  }

  return issuesCollection.findOneAndUpdate(
    {
      $and: [
        filter,
        { status: { $nin: ['fixed', 'wont_fix'] } },
        {
          $or: [
            { claimedBy: { $exists: false } },
            { claimedBy: userId },
            { claimedAt: { $lt: claimCutoff() } },
          ],
        },
      ],
    },
    [
      {
        $set: {
          claimedBy: userId,
          claimedAt: now,
          updatedAt: now,
          status: { $cond: [{ $eq: ['$status', 'backlog'] }, 'in_progress', '$status'] },
          assigneeId: { $cond: [takingOver, userId, { $ifNull: ['$assigneeId', userId] }] },
        },
      },
    ],
    { returnDocument: 'after' }
  )
}

/**
 * Claims an issue (ObjectId or "CUS-001") for the current user.
 * Throws a 409 if someone else holds a live claim.
 */
export async function claimIssue(id: string): Promise<IssueWithAssignee> {
  try {
    const user = await requireAuth('developer')

    const claimed = await claimForUser(issueQuery(id), user._id)

    if (!claimed) {
      const issuesCollection = await getCollection('issues')
      const issue = await issuesCollection.findOne(issueQuery(id))
      if (!issue) {
        throw new Error('Issue not found')
      }
      if (issue.status === 'fixed' || issue.status === 'wont_fix') {
        throw conflict(`Issue ${issue.issueNumber} is already closed (${issue.status})`)
      }
      const usersCollection = await getCollection('users')
      const holder = await usersCollection.findOne({ _id: issue.claimedBy })
      const until = issue.claimedAt
        ? ` until ${new Date(issue.claimedAt.getTime() + CLAIM_TTL_HOURS * 60 * 60 * 1000).toISOString()}`
        : ''
      throw conflict(`Issue ${issue.issueNumber} is claimed by ${holder?.name ?? 'another user'}${until}`)
    }

    revalidatePath('/issues')
    revalidatePath(`/issues/${id}`)

    return (await getIssue(claimed._id.toString()))!
  } catch (error) {
    console.error('Error claiming issue:', error)
    throw wrapError(error, 'Failed to claim issue')
  }
}

/**
 * Releases a claim. Only the claimer or an admin can release; releasing an
 * unclaimed issue is a no-op. The issue's status and assignee are left as they are.
 */
export async function releaseIssue(id: string): Promise<IssueWithAssignee> {
  try {
    const user = await requireAuth('developer')

    const issuesCollection = await getCollection('issues')
    const issue = await issuesCollection.findOne(issueQuery(id))
    if (!issue) {
      throw new Error('Issue not found')
    }

    const heldByOther =
      issue.claimedBy && !issue.claimedBy.equals(user._id) && issue.claimedAt >= claimCutoff()
    if (heldByOther && user.role !== 'admin') {
      throw conflict(`Issue ${issue.issueNumber} is claimed by someone else; only they or an admin can release it`)
    }

    await issuesCollection.updateOne(
      { _id: issue._id },
      { $unset: { claimedBy: '', claimedAt: '' }, $set: { updatedAt: new Date() } }
    )

    revalidatePath('/issues')
    revalidatePath(`/issues/${id}`)

    return (await getIssue(issue._id.toString()))!
  } catch (error) {
    console.error('Error releasing issue:', error)
    throw wrapError(error, 'Failed to release issue')
  }
}

/**
 * Finds the next issue to work on: backlog, unclaimed (or claim expired), and either
 * unassigned or assigned to the caller. Ordered by priority then oldest first.
 * With claim=true the issue is atomically claimed for the caller (race-safe: if another
 * agent grabs it first, the next candidate is tried). Returns null when nothing is available.
 */
export async function getNextIssue(
  options: { projectId?: string; featureId?: string; claim?: boolean } = {}
): Promise<IssueWithAssignee | null> {
  try {
    const user = await requireAuth(options.claim ? 'developer' : 'viewer')

    const issuesCollection = await getCollection('issues')

    const cutoff = claimCutoff()
    // Offer (a) free backlog issues that are unassigned or already assigned to the caller, and
    // (b) in-progress issues whose claim has expired (abandoned work), whoever had them
    const match: any = {
      $or: [
        {
          status: 'backlog',
          $and: [
            { $or: [{ claimedBy: { $exists: false } }, { claimedAt: { $lt: cutoff } }] },
            { $or: [{ assigneeId: { $exists: false } }, { assigneeId: user._id }] },
          ],
        },
        { status: 'in_progress', claimedAt: { $lt: cutoff } },
      ],
    }
    if (options.projectId) {
      if (!ObjectId.isValid(options.projectId)) throw new Error('Invalid project ID')
      match.projectId = new ObjectId(options.projectId)
    }
    if (options.featureId) {
      const { resolveFeatureId } = await import('@/lib/features')
      match.featureId = await resolveFeatureId(options.featureId)
    }

    const candidates = await issuesCollection
      .aggregate([
        { $match: match },
        {
          $addFields: {
            _rank: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'critical'] }, then: 0 },
                  { case: { $eq: ['$priority', 'high'] }, then: 1 },
                  { case: { $eq: ['$priority', 'medium'] }, then: 2 },
                ],
                default: 3,
              },
            },
          },
        },
        { $sort: { _rank: 1, createdAt: 1 } },
        { $limit: 10 },
      ])
      .toArray()

    for (const candidate of candidates) {
      if (!options.claim) {
        return await getIssue(candidate._id.toString())
      }
      // Another agent may have taken it since we listed; if so try the next candidate
      const claimed = await claimForUser({ _id: candidate._id }, user._id)
      if (claimed) {
        revalidatePath('/issues')
        return await getIssue(claimed._id.toString())
      }
    }

    return null
  } catch (error) {
    console.error('Error getting next issue:', error)
    throw wrapError(error, 'Failed to get next issue')
  }
}
