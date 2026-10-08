import { NextRequest } from 'next/server'
import { createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { claimIssue, releaseIssue } from '@/app/issues/claim-actions'
import { serializeForApi } from '@/lib/api-utils'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/v1/issues/:id/claim
 * Claim an issue for the authenticated user. Returns 409 if someone else holds a live claim.
 * Re-claiming your own issue refreshes the claim (use as a heartbeat on long tasks).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const issue = await claimIssue(id)

    return createApiResponse({ data: serializeForApi(issue) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * DELETE /api/v1/issues/:id/claim
 * Release a claim. Only the claimer or an admin can release a live claim.
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const issue = await releaseIssue(id)

    return createApiResponse({ data: serializeForApi(issue) })
  } catch (error) {
    return handleApiError(error, true)
  }
}
