'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireUnifiedAuth as requireAuth } from '@/lib/unified-auth'
import {
  Issue,
  CreateIssueData,
  UpdateIssueData,
  IssueFilter,
  IssueWithAssignee
} from '@/lib/types'
import { isEmptyOrWhitespace } from '@/lib/utils'
import { getNextIssueNumber } from '@/app/projects/actions'

/**
 * Creates a new issue
 * @param data - Issue data to create
 * @returns Promise<Issue> - Created issue
 */
export async function createIssue(data: CreateIssueData): Promise<Issue> {
  try {
    const user = await requireAuth('developer')

    // Validate input
    if (isEmptyOrWhitespace(data.title)) {
      throw new Error('Issue title is required')
    }

    if (isEmptyOrWhitespace(data.description)) {
      throw new Error('Issue description is required')
    }

    if (!data.projectId) {
      throw new Error('Project is required')
    }

    console.log('[createIssue] Received projectId:', data.projectId, 'Type:', typeof data.projectId)

    if (!ObjectId.isValid(data.projectId)) {
      throw new Error('Invalid project ID')
    }

    // Verify the project exists
    const projectsCollection = await getCollection('projects')
    console.log('[createIssue] Looking for project with _id:', data.projectId)
    const project = await projectsCollection.findOne({ _id: new ObjectId(data.projectId) })
    console.log('[createIssue] Project found:', project ? `Yes (${project.name})` : 'No')

    if (!project) {
      throw new Error('Project not found. Please select a valid project.')
    }

    // Get the next issue number for this project
    console.log('[createIssue] Calling getNextIssueNumber with:', data.projectId)
    const issueNumber = await getNextIssueNumber(data.projectId)

    const issuesCollection = await getCollection('issues')

    const newIssue: Omit<Issue, '_id'> = {
      projectId: new ObjectId(data.projectId),
      issueNumber,
      title: data.title.trim(),
      description: data.description.trim(),
      status: 'backlog',
      priority: data.priority,
      assigneeId: data.assigneeId ? new ObjectId(data.assigneeId) : undefined,
      reporterId: user._id,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: data.dueDate,
    }

    const result = await issuesCollection.insertOne(newIssue as any)

    // Revalidate the issues page to show the new issue
    revalidatePath('/issues')
    revalidatePath(`/projects/${data.projectId}`)
    revalidatePath('/')

    return {
      _id: result.insertedId,
      ...newIssue,
    }
  } catch (error) {
    console.error('Error creating issue:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create issue')
  }
}

/**
 * Gets all issues with optional filtering
 * @param filter - Optional filter criteria
 * @returns Promise<IssueWithAssignee[]> - List of issues with assignee details
 */
export async function getIssues(filter: IssueFilter = {}): Promise<IssueWithAssignee[]> {
  try {
    const user = await requireAuth('viewer')

    const issuesCollection = await getCollection('issues')
    const usersCollection = await getCollection('users')
    const projectsCollection = await getCollection('projects')

    // Build query
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

    if (filter.assigneeId) {
      query.assigneeId = new ObjectId(filter.assigneeId)
    }

    if (filter.reporterId) {
      query.reporterId = new ObjectId(filter.reporterId)
    }

    if (filter.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags }
    }

    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { issueNumber: { $regex: filter.search, $options: 'i' } },
      ]
    }

    // Get issues
    const issues = await issuesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    // If no issues, return empty array early
    if (issues.length === 0) {
      return []
    }

    // Get user details for assignees and reporters
    const userIds = new Set<string>()
    const projectIds = new Set<string>()
    issues.forEach(issue => {
      if (issue.reporterId) {
        userIds.add(issue.reporterId.toString())
      }
      if (issue.assigneeId) {
        userIds.add(issue.assigneeId.toString())
      }
      if (issue.projectId) {
        projectIds.add(issue.projectId.toString())
      }
    })

    const users = await usersCollection
      .find({ _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) } })
      .toArray()

    const projects = await projectsCollection
      .find({ _id: { $in: Array.from(projectIds).map(id => new ObjectId(id)) } })
      .toArray()

    const userMap = new Map(users.map(user => [user._id.toString(), user]))
    const projectMap = new Map(projects.map(project => [project._id.toString(), project]))

    // Transform issues to include user and project details
    const issuesWithAssignees: IssueWithAssignee[] = issues.map(issue => {
      const reporter = issue.reporterId ? userMap.get(issue.reporterId.toString()) : undefined
      const assignee = issue.assigneeId ? userMap.get(issue.assigneeId.toString()) : undefined
      const project = issue.projectId ? projectMap.get(issue.projectId.toString()) : undefined

      if (!reporter) {
        console.warn('Reporter not found for issue:', issue._id?.toString(), 'reporterId:', issue.reporterId?.toString())
      }

      if (!project) {
        console.warn('Project not found for issue:', issue._id?.toString(), 'projectId:', issue.projectId?.toString())
      }

      return {
        ...issue,
        project: project ? {
          _id: project._id,
          name: project.name,
          key: project.key,
        } : {
          _id: new ObjectId(),
          name: 'Unknown Project',
          key: 'UNK',
        },
        assignee: assignee ? {
          _id: assignee._id,
          name: assignee.name,
          email: assignee.email,
        } : undefined,
        reporter: reporter ? {
          _id: reporter._id,
          name: reporter.name,
          email: reporter.email,
        } : {
          _id: new ObjectId(),
          name: 'Unknown Reporter',
          email: 'unknown@example.com',
        },
      } as IssueWithAssignee
    })

    return issuesWithAssignees
  } catch (error) {
    console.error('Error getting issues:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get issues')
  }
}

/**
 * Gets a single issue by ID
 * @param id - Issue ID
 * @returns Promise<IssueWithAssignee | null> - Issue with assignee details or null if not found
 */
export async function getIssue(id: string): Promise<IssueWithAssignee | null> {
  try {
    const user = await requireAuth('viewer')

    const issuesCollection = await getCollection('issues')
    const usersCollection = await getCollection('users')
    const projectsCollection = await getCollection('projects')

    // Support both ObjectId and human-readable issue numbers (e.g., "ISS-004")
    let issue
    if (ObjectId.isValid(id)) {
      issue = await issuesCollection.findOne({ _id: new ObjectId(id) })
    } else {
      issue = await issuesCollection.findOne({ issueNumber: id })
    }

    if (!issue) {
      return null
    }

    // Get user and project details
    const reporter = await usersCollection.findOne({ _id: issue.reporterId })
    const assignee = issue.assigneeId
      ? await usersCollection.findOne({ _id: issue.assigneeId })
      : undefined
    const project = await projectsCollection.findOne({ _id: issue.projectId })

    return {
      ...issue,
      project: project ? {
        _id: project._id,
        name: project.name,
        key: project.key,
      } : {
        _id: new ObjectId(),
        name: 'Unknown Project',
        key: 'UNK',
      },
      assignee: assignee ? {
        _id: assignee._id,
        name: assignee.name,
        email: assignee.email,
      } : undefined,
      reporter: reporter ? {
        _id: reporter._id,
        name: reporter.name,
        email: reporter.email,
      } : {
        _id: new ObjectId(),
        name: 'Unknown Reporter',
        email: 'unknown@example.com',
      },
    } as IssueWithAssignee
  } catch (error) {
    console.error('Error getting issue:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get issue')
  }
}

/**
 * Updates an existing issue
 * @param id - Issue ID
 * @param data - Updated issue data
 * @returns Promise<Issue> - Updated issue
 */
export async function updateIssue(id: string, data: UpdateIssueData): Promise<Issue> {
  try {
    const user = await requireAuth('developer')

    const issuesCollection = await getCollection('issues')

    // Support both ObjectId and human-readable issue numbers (e.g., "ISS-004")
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { issueNumber: id }
    
    // Validate input if provided
    if (data.title !== undefined && isEmptyOrWhitespace(data.title)) {
      throw new Error('Issue title cannot be empty')
    }
    
    if (data.description !== undefined && isEmptyOrWhitespace(data.description)) {
      throw new Error('Issue description cannot be empty')
    }
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    if (data.title !== undefined) {
      updateData.title = data.title.trim()
    }
    
    if (data.description !== undefined) {
      updateData.description = data.description.trim()
    }
    
    if (data.status !== undefined) {
      updateData.status = data.status
    }
    
    if (data.priority !== undefined) {
      updateData.priority = data.priority
    }
    
    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId ? new ObjectId(data.assigneeId) : undefined
    }
    
    if (data.tags !== undefined) {
      updateData.tags = data.tags
    }
    
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate
    }
    
    const result = await issuesCollection.findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Issue not found')
    }

    // Revalidate paths
    revalidatePath('/issues')
    revalidatePath(`/issues/${id}`)
    revalidatePath('/')

    return result as Issue
  } catch (error) {
    console.error('Error updating issue:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update issue')
  }
}

/**
 * Deletes an issue
 * @param id - Issue ID
 * @returns Promise<boolean> - True if issue was deleted
 */
export async function deleteIssue(id: string): Promise<boolean> {
  try {
    const user = await requireAuth('developer')

    const issuesCollection = await getCollection('issues')
    const projectsCollection = await getCollection('projects')

    // Support both ObjectId and human-readable issue numbers (e.g., "ISS-004")
    const query = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { issueNumber: id }

    // Get the issue first to find its project
    const issue = await issuesCollection.findOne(query)

    if (!issue) {
      throw new Error('Issue not found')
    }

    // Delete the issue
    const result = await issuesCollection.deleteOne(query)

    if (result.deletedCount === 0) {
      throw new Error('Issue not found')
    }

    // Decrement the project's issue counter
    await projectsCollection.updateOne(
      { _id: issue.projectId },
      { $inc: { issueCounter: -1 } }
    )

    // Revalidate paths
    revalidatePath('/issues')
    revalidatePath('/')

    return true
  } catch (error) {
    console.error('Error deleting issue:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete issue')
  }
}

/**
 * Gets issue statistics for the dashboard
 * @returns Promise<Object> - Issue statistics
 */
export async function getIssueStats(): Promise<{
  total: number
  backlog: number
  inProgress: number
  blocked: number
  fixed: number
  wontFix: number
}> {
  try {
    const user = await requireAuth('viewer')

    const issuesCollection = await getCollection('issues')

    const [
      total,
      backlog,
      inProgress,
      blocked,
      fixed,
      wontFix
    ] = await Promise.all([
      issuesCollection.countDocuments(),
      issuesCollection.countDocuments({ status: 'backlog' }),
      issuesCollection.countDocuments({ status: 'in_progress' }),
      issuesCollection.countDocuments({ status: 'blocked' }),
      issuesCollection.countDocuments({ status: 'fixed' }),
      issuesCollection.countDocuments({ status: 'wont_fix' }),
    ])

    return {
      total,
      backlog,
      inProgress,
      blocked,
      fixed,
      wontFix,
    }
  } catch (error) {
    console.error('Error getting issue stats:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get issue statistics')
  }
}

/**
 * Gets all unique tags from issues
 * @returns Promise<string[]> - List of unique tags
 */
export async function getIssueTags(): Promise<string[]> {
  try {
    const user = await requireAuth('viewer')
    
    const issuesCollection = await getCollection('issues')
    
    const tags = await issuesCollection.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $sort: { _id: 1 } },
    ]).toArray()
    
    return tags.map(tag => tag._id)
  } catch (error) {
    console.error('Error getting issue tags:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get issue tags')
  }
}