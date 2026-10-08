import { NextRequest } from 'next/server'
import { createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getNextIssue } from '@/app/issues/claim-actions'
import { serializeForApi } from '@/lib/api-utils'

/**
 * GET /api/v1/issues/next?projectId=&featureId=
 * Peek at the next issue to work on (highest priority, oldest first) without claiming it.
 * Returns { data: null } when nothing is available.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const issue = await getNextIssue({
      projectId: searchParams.get('projectId') || undefined,
      featureId: searchParams.get('featureId') || undefined,
    })

    return createApiResponse({ data: serializeForApi(issue) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * POST /api/v1/issues/next
 * Atomically claim the next issue to work on. Body (optional): { projectId, featureId }.
 * Moves it to in_progress, assigns it to the caller if unassigned, and returns it.
 * Returns { data: null } when nothing is available.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const issue = await getNextIssue({
      projectId: body.projectId,
      featureId: body.featureId,
      claim: true,
    })

    return createApiResponse({ data: serializeForApi(issue) })
  } catch (error) {
    return handleApiError(error, true)
  }
}
