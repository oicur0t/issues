import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getFeatures, createFeature } from '@/app/features/actions'
import { serializeForApi, parsePaginationParams } from '@/lib/api-utils'
import { CreateFeatureData, FeatureFilter } from '@/lib/types'

/**
 * GET /api/v1/features
 * List all features with optional filtering
 * Authentication is handled by the action via unified-auth
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const { limit, offset } = parsePaginationParams(searchParams)

    const filter: FeatureFilter = {}

    if (searchParams.get('projectId')) {
      filter.projectId = searchParams.get('projectId')!
    }

    if (searchParams.get('status')) {
      filter.status = searchParams.get('status')!.split(',') as any
    }

    if (searchParams.get('priority')) {
      filter.priority = searchParams.get('priority')!.split(',') as any
    }

    if (searchParams.get('ownerId')) {
      filter.ownerId = searchParams.get('ownerId')!
    }

    if (searchParams.get('tags')) {
      filter.tags = searchParams.get('tags')!.split(',')
    }

    if (searchParams.get('search')) {
      filter.search = searchParams.get('search')!
    }

    const features = await getFeatures(filter)
    const paginatedFeatures = features.slice(offset, offset + limit)

    return createApiResponse({
      data: serializeForApi(paginatedFeatures),
      pagination: {
        limit,
        offset,
        total: features.length,
        hasMore: offset + limit < features.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/v1/features
 * Create a new feature
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.projectId || !body.title || !body.description) {
      return createApiError(400, 'Bad request - Missing required fields: projectId, title, description')
    }

    const featureData: CreateFeatureData = {
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      acceptanceCriteria: body.acceptanceCriteria,
      status: body.status,
      priority: body.priority,
      ownerId: body.ownerId,
      wikiSlug: body.wikiSlug,
      tags: body.tags || [],
      targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
    }

    const feature = await createFeature(featureData)

    return createApiResponse({ data: serializeForApi(feature) }, 201)
  } catch (error) {
    return handleApiError(error, true)
  }
}
