'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireUnifiedAuth as requireAuth } from '@/lib/unified-auth'
import {
  Project,
  CreateProjectData,
  UpdateProjectData,
  ProjectWithCreator
} from '@/lib/types/project'
import { isEmptyOrWhitespace } from '@/lib/utils'
import { isApiAuthError } from '@/lib/api-errors'

/**
 * Creates a new project
 * @param data - Project data to create
 * @returns Promise<Project> - Created project
 */
export async function createProject(data: CreateProjectData): Promise<Project> {
  try {
    const user = await requireAuth('developer')

    // Validate input
    if (isEmptyOrWhitespace(data.name)) {
      throw new Error('Project name is required')
    }

    if (isEmptyOrWhitespace(data.key)) {
      throw new Error('Project key is required')
    }

    // Validate key format (uppercase letters only, 2-5 characters)
    const keyRegex = /^[A-Z]{2,5}$/
    const trimmedKey = data.key.trim().toUpperCase()
    if (!keyRegex.test(trimmedKey)) {
      throw new Error('Project key must be 2-5 uppercase letters (e.g., CUS, PROJ)')
    }

    const projectsCollection = await getCollection('projects')

    // Check if key already exists
    const existingProject = await projectsCollection.findOne({ key: trimmedKey })
    if (existingProject) {
      throw new Error(`Project with key "${trimmedKey}" already exists`)
    }

    const newProject: Omit<Project, '_id'> = {
      name: data.name.trim(),
      key: trimmedKey,
      description: data.description.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user._id,
      issueCounter: 0,
    }

    const result = await projectsCollection.insertOne(newProject as any)

    // Revalidate the projects page
    revalidatePath('/projects')
    revalidatePath('/')

    return {
      _id: result.insertedId,
      ...newProject,
    }
  } catch (error) {
    console.error('Error creating project:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to create project')
  }
}

/**
 * Gets all projects
 * @returns Promise<ProjectWithCreator[]> - List of projects with creator details
 */
export async function getProjects(): Promise<ProjectWithCreator[]> {
  try {
    const user = await requireAuth('viewer')

    const projectsCollection = await getCollection('projects')
    const usersCollection = await getCollection('users')

    // Get projects
    const projects = await projectsCollection
      .find({})
      .sort({ name: 1 })
      .toArray()

    // Get user details for creators
    const userIds = new Set<string>()
    projects.forEach(project => {
      userIds.add(project.createdBy.toString())
    })

    const users = await usersCollection
      .find({ _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) } })
      .toArray()

    const userMap = new Map(users.map(user => [user._id.toString(), user]))

    // Transform projects to include creator details
    const projectsWithCreators: ProjectWithCreator[] = projects.map(project => {
      const creator = userMap.get(project.createdBy.toString())

      return {
        ...project,
        creator: creator ? {
          _id: creator._id,
          name: creator.name,
          email: creator.email,
        } : {
          _id: new ObjectId(),
          name: 'Unknown User',
          email: 'unknown@example.com',
        },
      } as ProjectWithCreator
    })

    return projectsWithCreators
  } catch (error) {
    console.error('Error getting projects:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get projects')
  }
}

/**
 * Gets a single project by ID
 * @param id - Project ID
 * @returns Promise<ProjectWithCreator | null> - Project with creator details or null if not found
 */
export async function getProject(id: string): Promise<ProjectWithCreator | null> {
  try {
    const user = await requireAuth('viewer')

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid project ID')
    }

    const projectsCollection = await getCollection('projects')
    const usersCollection = await getCollection('users')

    const project = await projectsCollection.findOne({ _id: new ObjectId(id) })

    if (!project) {
      return null
    }

    // Get creator details
    const creator = await usersCollection.findOne({ _id: project.createdBy })

    return {
      ...project,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
        email: creator.email,
      } : {
        _id: new ObjectId(),
        name: 'Unknown User',
        email: 'unknown@example.com',
      },
    } as ProjectWithCreator
  } catch (error) {
    console.error('Error getting project:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get project')
  }
}

/**
 * Gets a single project by key
 * @param key - Project key (e.g., "CUS")
 * @returns Promise<ProjectWithCreator | null> - Project with creator details or null if not found
 */
export async function getProjectByKey(key: string): Promise<ProjectWithCreator | null> {
  try {
    const user = await requireAuth('viewer')

    const projectsCollection = await getCollection('projects')
    const usersCollection = await getCollection('users')

    const project = await projectsCollection.findOne({ key: key.toUpperCase() })

    if (!project) {
      return null
    }

    // Get creator details
    const creator = await usersCollection.findOne({ _id: project.createdBy })

    return {
      ...project,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
        email: creator.email,
      } : {
        _id: new ObjectId(),
        name: 'Unknown User',
        email: 'unknown@example.com',
      },
    } as ProjectWithCreator
  } catch (error) {
    console.error('Error getting project by key:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get project')
  }
}

/**
 * Updates an existing project
 * @param id - Project ID
 * @param data - Updated project data
 * @returns Promise<Project> - Updated project
 */
export async function updateProject(id: string, data: UpdateProjectData): Promise<Project> {
  try {
    const user = await requireAuth('developer')

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid project ID')
    }

    const projectsCollection = await getCollection('projects')

    // Validate input if provided
    if (data.name !== undefined && isEmptyOrWhitespace(data.name)) {
      throw new Error('Project name cannot be empty')
    }

    if (data.key !== undefined) {
      const keyRegex = /^[A-Z]{2,5}$/
      const trimmedKey = data.key.trim().toUpperCase()
      if (!keyRegex.test(trimmedKey)) {
        throw new Error('Project key must be 2-5 uppercase letters')
      }

      // Check if key already exists (excluding current project)
      const existingProject = await projectsCollection.findOne({
        key: trimmedKey,
        _id: { $ne: new ObjectId(id) }
      })
      if (existingProject) {
        throw new Error(`Project with key "${trimmedKey}" already exists`)
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }

    if (data.key !== undefined) {
      updateData.key = data.key.trim().toUpperCase()
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim()
    }

    const result = await projectsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Project not found')
    }

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath(`/projects/${id}`)
    revalidatePath('/')

    return result as Project
  } catch (error) {
    console.error('Error updating project:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to update project')
  }
}

/**
 * Deletes a project
 * @param id - Project ID
 * @returns Promise<boolean> - True if project was deleted
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    const user = await requireAuth('developer')

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid project ID')
    }

    const projectsCollection = await getCollection('projects')
    const issuesCollection = await getCollection('issues')

    // Check if project has issues
    const issueCount = await issuesCollection.countDocuments({ projectId: new ObjectId(id) })
    if (issueCount > 0) {
      throw new Error(`Cannot delete project with ${issueCount} existing issue(s). Please delete or reassign issues first.`)
    }

    const result = await projectsCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      throw new Error('Project not found')
    }

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath('/')

    return true
  } catch (error) {
    console.error('Error deleting project:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to delete project')
  }
}

/**
 * Increments the issue counter for a project and returns the new issue number
 * @param projectId - Project ID
 * @returns Promise<string> - New issue number (e.g., "CUS-001")
 */
export async function getNextIssueNumber(projectId: string): Promise<string> {
  try {
    console.log('[getNextIssueNumber] Called with projectId:', projectId, 'Type:', typeof projectId)
    const user = await requireAuth('developer')

    if (!ObjectId.isValid(projectId)) {
      console.log('[getNextIssueNumber] Invalid ObjectId format')
      throw new Error('Invalid project ID')
    }

    const projectsCollection = await getCollection('projects')

    console.log('[getNextIssueNumber] Attempting to increment counter for project:', projectId)
    // Atomically increment the counter and get the new value
    const result = await projectsCollection.findOneAndUpdate(
      { _id: new ObjectId(projectId) },
      { $inc: { issueCounter: 1 } },
      { returnDocument: 'after' }
    )

    console.log('[getNextIssueNumber] findOneAndUpdate result:', result ? 'Found' : 'Not found')
    console.log('[getNextIssueNumber] result structure:', JSON.stringify(result, null, 2))

    if (!result) {
      console.log('[getNextIssueNumber] Project not found in database')
      throw new Error('Project not found')
    }

    const project = result
    const paddedNumber = project.issueCounter.toString().padStart(3, '0')
    const issueNumber = `${project.key}-${paddedNumber}`
    console.log('[getNextIssueNumber] Generated issue number:', issueNumber)

    return issueNumber
  } catch (error) {
    console.error('Error getting next issue number:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to generate issue number')
  }
}

/**
 * Recalculates issue counters for all projects based on actual issue counts
 * This fixes any desync between the counter and actual number of issues
 * @returns Promise<{ updated: number, results: Array<{ projectId: string, projectKey: string, oldCount: number, newCount: number }> }>
 */
export async function recalculateProjectIssueCounters(): Promise<{
  updated: number
  results: Array<{ projectId: string; projectKey: string; oldCount: number; newCount: number }>
}> {
  try {
    const user = await requireAuth('admin')

    const projectsCollection = await getCollection('projects')
    const issuesCollection = await getCollection('issues')

    // Get all projects
    const projects = await projectsCollection.find({}).toArray()

    const results = []
    let updated = 0

    // For each project, count actual issues and update counter
    for (const project of projects) {
      const oldCount = project.issueCounter

      // Count actual issues for this project
      const actualCount = await issuesCollection.countDocuments({
        projectId: project._id,
      })

      // Update if counts don't match
      if (oldCount !== actualCount) {
        await projectsCollection.updateOne(
          { _id: project._id },
          { $set: { issueCounter: actualCount } }
        )
        updated++
      }

      results.push({
        projectId: project._id.toString(),
        projectKey: project.key,
        oldCount,
        newCount: actualCount,
      })
    }

    // Revalidate paths
    revalidatePath('/projects')
    revalidatePath('/')

    return { updated, results }
  } catch (error) {
    console.error('Error recalculating project issue counters:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to recalculate project issue counters')
  }
}
