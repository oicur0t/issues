import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getFeatureIssues, linkIssueToFeature } from '@/app/features/actions'
import { serializeForApi } from '@/lib/api-utils'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/features/:id/issues
 * List issues linked to a feature
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const issues = await getFeatureIssues(id)

    return createApiResponse({ data: serializeForApi(issues) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * POST /api/v1/features/:id/issues
 * Link an existing issue to a feature. Body: { issueId } (ObjectId or e.g. CUS-001)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    if (!body.issueId) {
      return createApiError(400, 'Bad request - Missing required field: issueId')
    }

    await linkIssueToFeature(id, body.issueId)

    return createApiResponse({ message: 'Issue linked to feature' }, 201)
  } catch (error) {
    return handleApiError(error, true)
  }
}
