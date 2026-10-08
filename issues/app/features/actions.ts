'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireUnifiedAuth as requireAuth } from '@/lib/unified-auth'
import {
  Feature,
  CreateFeatureData,
  UpdateFeatureData,
  FeatureFilter,
  FeatureProgress,
  FeatureWithDetails,
  FeatureStatus,
  IssueWithAssignee,
} from '@/lib/types'
import { isEmptyOrWhitespace } from '@/lib/utils'
import { isApiAuthError } from '@/lib/api-errors'
import { getIssues } from '@/app/issues/actions'

const VALID_STATUSES: FeatureStatus[] = ['proposed', 'planned', 'in_progress', 'shipped', 'dropped']

function wrapError(error: unknown, fallback: string): Error {
  return isApiAuthError(error) ? (error as Error) : new Error(error instanceof Error ? error.message : fallback)
}

/** Builds a query matching either an ObjectId or a readable number like "CUS-F001" */
function idQuery(id: string) {
  return ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { featureNumber: id }
}

/** Generates the next feature number for a project, e.g. "CUS-F001" */
async function getNextFeatureNumber(projectId: ObjectId): Promise<string> {
  const projectsCollection = await getCollection('projects')
  // $inc creates the field when missing, so older projects need no migration
  const project = await projectsCollection.findOneAndUpdate(
    { _id: projectId },
    { $inc: { featureCounter: 1 } },
    { returnDocument: 'after' }
  )
  if (!project) {
    throw new Error('Project not found. Please select a valid project.')
  }
  return `${project.key}-F${String(project.featureCounter).padStart(3, '0')}`
}

/** Computes progress for a set of features from their linked issues, keyed by feature id */
async function getProgressMap(featureIds: ObjectId[]): Promise<Map<string, FeatureProgress>> {
  const map = new Map<string, FeatureProgress>()
  featureIds.forEach(id =>
    map.set(id.toString(), { total: 0, done: 0, inProgress: 0, blocked: 0, percent: 0 })
  )
  if (featureIds.length === 0) return map

  const issuesCollection = await getCollection('issues')
  const rows = await issuesCollection
    .aggregate([
      { $match: { featureId: { $in: featureIds }, status: { $ne: 'wont_fix' } } },
      { $group: { _id: { featureId: '$featureId', status: '$status' }, count: { $sum: 1 } } },
    ])
    .toArray()

  for (const row of rows) {
    const p = map.get(row._id.featureId.toString())!
    p.total += row.count
    if (row._id.status === 'fixed') p.done += row.count
    if (row._id.status === 'in_progress') p.inProgress += row.count
    if (row._id.status === 'blocked') p.blocked += row.count
  }
  map.forEach(p => {
    p.percent = p.total === 0 ? 0 : Math.round((p.done / p.total) * 100)
  })
  return map
}

/** Attaches project/owner/creator/progress to raw feature documents */
async function withDetails(features: any[]): Promise<FeatureWithDetails[]> {
  if (features.length === 0) return []

  const projectsCollection = await getCollection('projects')
  const usersCollection = await getCollection('users')

  const projectIds = new Set<string>()
  const userIds = new Set<string>()
  features.forEach(f => {
    projectIds.add(f.projectId.toString())
    userIds.add(f.createdBy.toString())
    if (f.ownerId) userIds.add(f.ownerId.toString())
  })

  const [projects, users, progressMap] = await Promise.all([
    projectsCollection.find({ _id: { $in: Array.from(projectIds).map(id => new ObjectId(id)) } }).toArray(),
    usersCollection.find({ _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) } }).toArray(),
    getProgressMap(features.map(f => f._id)),
  ])
  const projectMap = new Map(projects.map(p => [p._id.toString(), p]))
  const userMap = new Map(users.map(u => [u._id.toString(), u]))

  return features.map(f => {
    const project = projectMap.get(f.projectId.toString())
    const owner = f.ownerId ? userMap.get(f.ownerId.toString()) : undefined
    const creator = userMap.get(f.createdBy.toString())
    return {
      ...f,
      project: project
        ? { _id: project._id, name: project.name, key: project.key }
        : { _id: new ObjectId(), name: 'Unknown Project', key: 'UNK' },
      owner: owner ? { _id: owner._id, name: owner.name, email: owner.email } : undefined,
      creator: creator
        ? { _id: creator._id, name: creator.name, email: creator.email }
        : { _id: new ObjectId(), name: 'Unknown User', email: 'unknown@example.com' },
      progress: progressMap.get(f._id.toString())!,
    } as FeatureWithDetails
  })
}

/**
 * Creates a new feature
 */
export async function createFeature(data: CreateFeatureData): Promise<Feature> {
  try {
    const user = await requireAuth('developer')

    if (isEmptyOrWhitespace(data.title)) {
      throw new Error('Feature title is required')
    }
    if (isEmptyOrWhitespace(data.description)) {
      throw new Error('Feature description is required')
    }
    if (!data.projectId || !ObjectId.isValid(data.projectId)) {
      throw new Error('Invalid project ID')
    }
    if (data.status && !VALID_STATUSES.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`)
    }
    if (data.ownerId && !ObjectId.isValid(data.ownerId)) {
      throw new Error('Invalid owner ID')
    }

    const projectId = new ObjectId(data.projectId)
    const featureNumber = await getNextFeatureNumber(projectId)
    const status = data.status || 'proposed'
    const now = new Date()

    const newFeature: Omit<Feature, '_id'> = {
      projectId,
      featureNumber,
      title: data.title.trim(),
      description: data.description.trim(),
      acceptanceCriteria: data.acceptanceCriteria?.trim() || '',
      status,
      priority: data.priority || 'medium',
      ownerId: data.ownerId ? new ObjectId(data.ownerId) : undefined,
      wikiSlug: data.wikiSlug?.trim() || undefined,
      tags: data.tags || [],
      targetDate: data.targetDate,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
      shippedAt: status === 'shipped' ? now : undefined,
    }

    const featuresCollection = await getCollection('features')
    const result = await featuresCollection.insertOne(newFeature as any)

    revalidatePath('/features')
    revalidatePath('/')

    return { _id: result.insertedId, ...newFeature }
  } catch (error) {
    console.error('Error creating feature:', error)
    throw wrapError(error, 'Failed to create feature')
  }
}

/**
 * Gets all features with optional filtering
 */
export async function getFeatures(filter: FeatureFilter = {}): Promise<FeatureWithDetails[]> {
  try {
    await requireAuth('viewer')

    const featuresCollection = await getCollection('features')
    const query: any = {}

    if (filter.projectId) {
      query.projectId = new ObjectId(filter.projectId)
    }
    if (filter.status && filter.status.length > 0) {
      query.status = { $in: filter.status }
    }
    if (filter.priority && filter.priority.length > 0) {
      query.priority = { $in: filter.priority }
    }
    if (filter.ownerId) {
      query.ownerId = new ObjectId(filter.ownerId)
    }
    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags }
    }
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { featureNumber: { $regex: filter.search, $options: 'i' } },
      ]
    }

    const features = await featuresCollection.find(query).sort({ createdAt: -1 }).toArray()
    return await withDetails(features)
  } catch (error) {
    console.error('Error getting features:', error)
    throw wrapError(error, 'Failed to get features')
  }
}

/**
 * Gets a single feature by ObjectId or readable number (e.g. "CUS-F001")
 */
export async function getFeature(id: string): Promise<FeatureWithDetails | null> {
  try {
    await requireAuth('viewer')

    const featuresCollection = await getCollection('features')
    const feature = await featuresCollection.findOne(idQuery(id))
    if (!feature) return null

    const [detailed] = await withDetails([feature])
    return detailed
  } catch (error) {
    console.error('Error getting feature:', error)
    throw wrapError(error, 'Failed to get feature')
  }
}

/**
 * Updates an existing feature. Setting status to shipped stamps shippedAt;
 * the result carries warnings if linked issues are still open.
 */
export async function updateFeature(id: string, data: UpdateFeatureData): Promise<FeatureWithDetails> {
  try {
    await requireAuth('developer')

    const featuresCollection = await getCollection('features')

    if (data.title !== undefined && isEmptyOrWhitespace(data.title)) {
      throw new Error('Feature title cannot be empty')
    }
    if (data.description !== undefined && isEmptyOrWhitespace(data.description)) {
      throw new Error('Feature description cannot be empty')
    }
    if (data.status !== undefined && !VALID_STATUSES.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`)
    }
    if (data.ownerId && !ObjectId.isValid(data.ownerId)) {
      throw new Error('Invalid owner ID')
    }

    const existing = await featuresCollection.findOne(idQuery(id))
    if (!existing) {
      throw new Error('Feature not found')
    }

    const set: any = { updatedAt: new Date() }
    const unset: any = {}

    if (data.title !== undefined) set.title = data.title.trim()
    if (data.description !== undefined) set.description = data.description.trim()
    if (data.acceptanceCriteria !== undefined) set.acceptanceCriteria = data.acceptanceCriteria.trim()
    if (data.priority !== undefined) set.priority = data.priority
    if (data.tags !== undefined) set.tags = data.tags

    if (data.wikiSlug !== undefined) {
      if (data.wikiSlug.trim()) set.wikiSlug = data.wikiSlug.trim()
      else unset.wikiSlug = ''
    }
    if (data.ownerId !== undefined) {
      if (data.ownerId) set.ownerId = new ObjectId(data.ownerId)
      else unset.ownerId = ''
    }
    if (data.targetDate !== undefined) {
      if (data.targetDate) set.targetDate = data.targetDate
      else unset.targetDate = ''
    }
    if (data.status !== undefined) {
      set.status = data.status
      if (data.status === 'shipped' && existing.status !== 'shipped') set.shippedAt = new Date()
      if (data.status !== 'shipped' && existing.status === 'shipped') unset.shippedAt = ''
    }

    const result = await featuresCollection.findOneAndUpdate(
      { _id: existing._id },
      { $set: set, ...(Object.keys(unset).length > 0 && { $unset: unset }) },
      { returnDocument: 'after' }
    )
    if (!result) {
      throw new Error('Feature not found')
    }

    revalidatePath('/features')
    revalidatePath(`/features/${id}`)
    revalidatePath('/')

    const [detailed] = await withDetails([result])
    if (data.status === 'shipped') {
      const open = detailed.progress.total - detailed.progress.done
      if (open > 0) {
        detailed.warnings = [`${open} linked issue${open === 1 ? '' : 's'} still open`]
      }
    }
    return detailed
  } catch (error) {
    console.error('Error updating feature:', error)
    throw wrapError(error, 'Failed to update feature')
  }
}

/**
 * Deletes a feature. Linked issues are unlinked, not deleted.
 */
export async function deleteFeature(id: string): Promise<boolean> {
  try {
    await requireAuth('developer')

    const featuresCollection = await getCollection('features')
    const issuesCollection = await getCollection('issues')

    const feature = await featuresCollection.findOne(idQuery(id))
    if (!feature) {
      throw new Error('Feature not found')
    }

    await issuesCollection.updateMany({ featureId: feature._id }, { $unset: { featureId: '' } })
    await featuresCollection.deleteOne({ _id: feature._id })

    revalidatePath('/features')
    revalidatePath('/issues')
    revalidatePath('/')

    return true
  } catch (error) {
    console.error('Error deleting feature:', error)
    throw wrapError(error, 'Failed to delete feature')
  }
}

/**
 * Gets the issues linked to a feature
 */
export async function getFeatureIssues(id: string): Promise<IssueWithAssignee[]> {
  try {
    await requireAuth('viewer')

    const featuresCollection = await getCollection('features')
    const feature = await featuresCollection.findOne(idQuery(id), { projection: { _id: 1 } })
    if (!feature) {
      throw new Error('Feature not found')
    }

    return await getIssues({ featureId: feature._id.toString() })
  } catch (error) {
    console.error('Error getting feature issues:', error)
    throw wrapError(error, 'Failed to get feature issues')
  }
}

/**
 * Links an existing issue (ObjectId or "CUS-001") to a feature
 */
export async function linkIssueToFeature(featureId: string, issueId: string): Promise<boolean> {
  try {
    await requireAuth('developer')

    const featuresCollection = await getCollection('features')
    const issuesCollection = await getCollection('issues')

    const feature = await featuresCollection.findOne(idQuery(featureId), { projection: { _id: 1 } })
    if (!feature) {
      throw new Error('Feature not found')
    }

    const issueQuery = ObjectId.isValid(issueId) ? { _id: new ObjectId(issueId) } : { issueNumber: issueId }
    const result = await issuesCollection.updateOne(issueQuery, {
      $set: { featureId: feature._id, updatedAt: new Date() },
    })
    if (result.matchedCount === 0) {
      throw new Error('Issue not found')
    }

    revalidatePath('/features')
    revalidatePath(`/features/${featureId}`)
    revalidatePath('/issues')

    return true
  } catch (error) {
    console.error('Error linking issue to feature:', error)
    throw wrapError(error, 'Failed to link issue to feature')
  }
}

/**
 * Unlinks an issue from a feature
 */
export async function unlinkIssueFromFeature(featureId: string, issueId: string): Promise<boolean> {
  try {
    await requireAuth('developer')

    const featuresCollection = await getCollection('features')
    const issuesCollection = await getCollection('issues')

    const feature = await featuresCollection.findOne(idQuery(featureId), { projection: { _id: 1 } })
    if (!feature) {
      throw new Error('Feature not found')
    }

    const issueQuery = ObjectId.isValid(issueId) ? { _id: new ObjectId(issueId) } : { issueNumber: issueId }
    const result = await issuesCollection.updateOne(
      { ...issueQuery, featureId: feature._id },
      { $unset: { featureId: '' }, $set: { updatedAt: new Date() } }
    )
    if (result.matchedCount === 0) {
      throw new Error('Issue not found on this feature')
    }

    revalidatePath('/features')
    revalidatePath(`/features/${featureId}`)
    revalidatePath('/issues')

    return true
  } catch (error) {
    console.error('Error unlinking issue from feature:', error)
    throw wrapError(error, 'Failed to unlink issue from feature')
  }
}
