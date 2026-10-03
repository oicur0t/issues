import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { createComment, getComments } from '@/app/issues/[id]/comments/actions'
import { serializeForApi } from '@/lib/api-utils'

/**
 * GET /api/v1/issues/[id]/comments
 * Get all comments for an issue
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const comments = await getComments(id)

    return createApiResponse({
      data: serializeForApi(comments),
    })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * POST /api/v1/issues/[id]/comments
 * Create a new comment on an issue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.content) {
      return createApiError(400, 'Bad request - Missing required field: content')
    }

    const comment = await createComment({
      issueId: id,
      content: body.content,
    })

    return createApiResponse(
      { data: serializeForApi(comment) },
      201
    )
  } catch (error) {
    return handleApiError(error, true)
  }
}
