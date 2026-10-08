import { NextRequest } from 'next/server'
import { createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { unlinkIssueFromFeature } from '@/app/features/actions'

interface RouteContext {
  params: Promise<{
    id: string
    issueId: string
  }>
}

/**
 * DELETE /api/v1/features/:id/issues/:issueId
 * Unlink an issue from a feature
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id, issueId } = await context.params
    await unlinkIssueFromFeature(id, issueId)

    return createApiResponse({ message: 'Issue unlinked from feature' })
  } catch (error) {
    return handleApiError(error, true)
  }
}
