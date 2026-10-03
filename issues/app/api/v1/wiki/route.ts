import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getWikiPages, createWikiPage, searchWikiPages } from '@/app/wiki/actions'
import { serializeForApi, parsePaginationParams } from '@/lib/api-utils'
import { CreateWikiData, WikiFilter } from '@/lib/types'

/**
 * GET /api/v1/wiki
 * List all wiki pages with optional filtering and search
 */
export async function GET(request: NextRequest) {
  try {


    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const { limit, offset } = parsePaginationParams(searchParams)

    // Check if this is a search request
    const searchQuery = searchParams.get('search')

    let wikiPages

    if (searchQuery) {
      // Perform search
      wikiPages = await searchWikiPages(searchQuery)
    } else {
      // Build filter
      const filter: WikiFilter = {}

      if (searchParams.get('tags')) {
        filter.tags = searchParams.get('tags')!.split(',')
      }

      if (searchParams.get('authorId')) {
        filter.authorId = searchParams.get('authorId')!
      }

      if (searchParams.get('isPublished')) {
        filter.isPublished = searchParams.get('isPublished') === 'true'
      }

      // Get wiki pages
      wikiPages = await getWikiPages(filter)
    }

    // Apply pagination
    const paginatedPages = wikiPages.slice(offset, offset + limit)

    // Serialize and return
    return createApiResponse({
      data: serializeForApi(paginatedPages),
      pagination: {
        limit,
        offset,
        total: wikiPages.length,
        hasMore: offset + limit < wikiPages.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/v1/wiki
 * Create a new wiki page
 */
export async function POST(request: NextRequest) {
  try {


    // Parse body
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.content) {
      return createApiError(400, 'Bad request - Missing required fields: title, content')
    }

    // Create wiki data
    const wikiData: CreateWikiData = {
      title: body.title,
      content: body.content,
      summary: body.summary,
      tags: body.tags || [],
      isPublished: body.isPublished !== undefined ? body.isPublished : true,
    }

    // Create the wiki page
    const wikiPage = await createWikiPage(wikiData)

    // Return created wiki page
    return createApiResponse(
      { data: serializeForApi(wikiPage) },
      201
    )
  } catch (error) {
    return handleApiError(error, true)
  }
}
