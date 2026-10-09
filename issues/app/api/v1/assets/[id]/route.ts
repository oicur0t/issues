import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getAsset, updateAsset, deleteAsset } from '@/app/assets/actions'
import { serializeForApi } from '@/lib/api-utils'
import { UpdateAssetData } from '@/lib/types'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/assets/[id]
 * Get a single asset by ID
 * Authentication is handled by the action via unified-auth
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const asset = await getAsset(id)

    if (!asset) {
      return createApiError(404, 'Asset not found')
    }

    return createApiResponse({ data: serializeForApi(asset) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * PUT /api/v1/assets/[id]
 * Update an asset
 * Authentication is handled by the action via unified-auth
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    // Create update data from body
    const updateData: UpdateAssetData = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.hostname !== undefined) updateData.hostname = body.hostname
    if (body.ipAddresses !== undefined) updateData.ipAddresses = body.ipAddresses
    if (body.type !== undefined) updateData.type = body.type
    if (body.status !== undefined) updateData.status = body.status
    if (body.os !== undefined) updateData.os = body.os
    if (body.provider !== undefined) updateData.provider = body.provider
    if (body.location !== undefined) updateData.location = body.location
    if (body.cost !== undefined) updateData.cost = body.cost
    if (body.vendorUrl !== undefined) updateData.vendorUrl = body.vendorUrl
    if (body.accounts !== undefined) updateData.accounts = body.accounts
    if (body.customFields !== undefined) updateData.customFields = body.customFields
    if (body.needsReview !== undefined) updateData.needsReview = body.needsReview
    if (body.description !== undefined) updateData.description = body.description
    if (body.projects !== undefined) updateData.projects = body.projects
    if (body.tags !== undefined) updateData.tags = body.tags

    const updated = await updateAsset(id, updateData)

    // Return the same populated shape as GET (project keys and names, creator), not the raw document
    const asset = await getAsset(updated._id!.toString())

    return createApiResponse({ data: serializeForApi(asset ?? updated) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * DELETE /api/v1/assets/[id]
 * Delete an asset
 * Authentication is handled by the action via unified-auth
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    await deleteAsset(id)

    return createApiResponse({ message: 'Asset deleted successfully' })
  } catch (error) {
    return handleApiError(error, true)
  }
}
