import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getAssets, createAsset } from '@/app/assets/actions'
import { serializeForApi, parsePaginationParams } from '@/lib/api-utils'
import { CreateAssetData, AssetFilter } from '@/lib/types'

/**
 * GET /api/v1/assets
 * List all assets with optional filtering
 * Authentication is handled by the action via unified-auth
 */
export async function GET(request: NextRequest) {
  try {
    // Parse pagination
    const searchParams = request.nextUrl.searchParams
    const { limit, offset } = parsePaginationParams(searchParams)

    // Parse filters
    const filter: AssetFilter = {}

    const typeParam = searchParams.get('type')
    if (typeParam) {
      filter.type = typeParam.split(',') as any[]
    }

    const projectId = searchParams.get('projectId')
    if (projectId) {
      filter.projectId = projectId
    }

    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      filter.tags = tagsParam.split(',')
    }

    const statusParam = searchParams.get('status')
    if (statusParam) {
      filter.status = statusParam.split(',') as any[]
    }

    const provider = searchParams.get('provider')
    if (provider) {
      filter.provider = provider
    }

    const location = searchParams.get('location')
    if (location) {
      filter.location = location
    }

    const search = searchParams.get('search')
    if (search) {
      filter.search = search
    }

    // Get assets (authentication handled by unified-auth in action)
    const assets = await getAssets(filter)

    // Apply pagination
    const paginatedAssets = assets.slice(offset, offset + limit)

    // Serialize and return
    return createApiResponse({
      data: serializeForApi(paginatedAssets),
      pagination: {
        limit,
        offset,
        total: assets.length,
        hasMore: offset + limit < assets.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/v1/assets
 * Create a new asset
 * Authentication is handled by the action via unified-auth
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.type || !body.status) {
      return createApiError(400, 'Bad request - Missing required fields: name, type, status')
    }

    // Create asset data
    const assetData: CreateAssetData = {
      name: body.name,
      hostname: body.hostname,
      ipAddresses: body.ipAddresses || [],
      type: body.type,
      status: body.status,
      os: body.os,
      provider: body.provider,
      location: body.location,
      cost: body.cost,
      vendorUrl: body.vendorUrl,
      accounts: body.accounts || [],
      description: body.description,
      projects: body.projects || [],
      tags: body.tags || [],
    }

    // Create the asset
    const asset = await createAsset(assetData)

    // Return created asset
    return createApiResponse(
      { data: serializeForApi(asset) },
      201
    )
  } catch (error) {
    return handleApiError(error, true)
  }
}
