import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { getProjects, createProject } from '@/app/projects/actions'
import { serializeForApi, parsePaginationParams } from '@/lib/api-utils'
import { CreateProjectData } from '@/lib/types'

/**
 * GET /api/v1/projects
 * List all projects
 * Authentication is handled by the action via unified-auth
 */
export async function GET(request: NextRequest) {
  try {
    // Parse pagination
    const searchParams = request.nextUrl.searchParams
    const { limit, offset } = parsePaginationParams(searchParams)

    // Get projects (authentication handled by unified-auth in action)
    const projects = await getProjects()

    // Apply pagination
    const paginatedProjects = projects.slice(offset, offset + limit)

    // Serialize and return
    return createApiResponse({
      data: serializeForApi(paginatedProjects),
      pagination: {
        limit,
        offset,
        total: projects.length,
        hasMore: offset + limit < projects.length,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, 'Internal server error')
  }
}

/**
 * POST /api/v1/projects
 * Create a new project
 * Authentication is handled by the action via unified-auth
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.key || !body.description) {
      return createApiError(400, 'Bad request - Missing required fields: name, key, description')
    }

    // Create project data
    const projectData: CreateProjectData = {
      name: body.name,
      key: body.key,
      description: body.description,
    }

    // Create the project
    const project = await createProject(projectData)

    // Return created project
    return createApiResponse(
      { data: serializeForApi(project) },
      201
    )
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error')
  }
}
