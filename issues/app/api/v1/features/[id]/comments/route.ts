import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { createFeatureComment, getFeatureComments } from '@/app/features/[id]/comments/actions'
import { serializeForApi } from '@/lib/api-utils'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/features/:id/comments
 * List comments on a feature (id may be an ObjectId or a number like CUS-F001)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const comments = await getFeatureComments(id)

    return createApiResponse({ data: serializeForApi(comments) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * POST /api/v1/features/:id/comments
 * Add a comment to a feature. Body: { content }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    if (!body.content) {
      return createApiError(400, 'Bad request - Missing required field: content')
    }

    const comment = await createFeatureComment({ featureId: id, content: body.content })

    return createApiResponse({ data: serializeForApi(comment) }, 201)
  } catch (error) {
    return handleApiError(error, true)
  }
}
