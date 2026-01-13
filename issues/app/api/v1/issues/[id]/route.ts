import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { getIssue, updateIssue, deleteIssue } from '@/app/issues/actions'
import { serializeForApi } from '@/lib/api-utils'
import { UpdateIssueData } from '@/lib/types'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/issues/:id
 * Get a single issue by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {


    // Get issue ID
    const { id } = await context.params

    // Get the issue
    const issue = await getIssue(id)

    if (!issue) {
      return createApiError(404, 'Issue not found')
    }

    // Return issue
    return createApiResponse({
      data: serializeForApi(issue),
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, 'Internal server error')
  }
}

/**
 * PUT /api/v1/issues/:id
 * Update an issue
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {


    // Get issue ID
    const { id } = await context.params

    // Parse body
    const body = await request.json()

    // Build update data
    const updateData: UpdateIssueData = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : undefined
    }

    // Update the issue
    const issue = await updateIssue(id, updateData)

    // Return updated issue
    return createApiResponse({
      data: serializeForApi(issue),
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error')
  }
}

/**
 * DELETE /api/v1/issues/:id
 * Delete an issue
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {


    // Get issue ID
    const { id } = await context.params

    // Delete the issue
    await deleteIssue(id)

    // Return success
    return createApiResponse({
      message: 'Issue deleted successfully',
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error')
  }
}
