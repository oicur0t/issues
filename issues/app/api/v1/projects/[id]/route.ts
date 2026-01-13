import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { getProject, updateProject, deleteProject } from '@/app/projects/actions'
import { serializeForApi } from '@/lib/api-utils'
import { UpdateProjectData } from '@/lib/types'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/projects/:id
 * Get a single project by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {


    // Get project ID
    const { id } = await context.params

    // Get the project
    const project = await getProject(id)

    if (!project) {
      return createApiError(404, 'Project not found')
    }

    // Return project
    return createApiResponse({
      data: serializeForApi(project),
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, 'Internal server error')
  }
}

/**
 * PUT /api/v1/projects/:id
 * Update a project
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {


    // Get project ID
    const { id } = await context.params

    // Parse body
    const body = await request.json()

    // Build update data
    const updateData: UpdateProjectData = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.key !== undefined) updateData.key = body.key
    if (body.description !== undefined) updateData.description = body.description

    // Update the project
    const project = await updateProject(id, updateData)

    // Return updated project
    return createApiResponse({
      data: serializeForApi(project),
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error')
  }
}

/**
 * DELETE /api/v1/projects/:id
 * Delete a project
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {


    // Get project ID
    const { id } = await context.params

    // Delete the project
    await deleteProject(id)

    // Return success
    return createApiResponse({
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error')
  }
}
