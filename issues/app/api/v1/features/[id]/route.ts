import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getFeature, updateFeature, deleteFeature } from '@/app/features/actions'
import { serializeForApi } from '@/lib/api-utils'
import { UpdateFeatureData } from '@/lib/types'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/features/:id
 * Get a single feature by ObjectId or number (e.g. CUS-F001)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const feature = await getFeature(id)

    if (!feature) {
      return createApiError(404, 'Feature not found')
    }

    return createApiResponse({ data: serializeForApi(feature) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * PUT /api/v1/features/:id
 * Update a feature
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const updateData: UpdateFeatureData = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.acceptanceCriteria !== undefined) updateData.acceptanceCriteria = body.acceptanceCriteria
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.ownerId !== undefined) updateData.ownerId = body.ownerId
    if (body.wikiSlug !== undefined) updateData.wikiSlug = body.wikiSlug
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.targetDate !== undefined) {
      updateData.targetDate = body.targetDate ? new Date(body.targetDate) : null
    }

    const feature = await updateFeature(id, updateData)

    return createApiResponse({ data: serializeForApi(feature) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * DELETE /api/v1/features/:id
 * Delete a feature (linked issues are unlinked, not deleted)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteFeature(id)

    return createApiResponse({ message: 'Feature deleted successfully' })
  } catch (error) {
    return handleApiError(error, true)
  }
}
