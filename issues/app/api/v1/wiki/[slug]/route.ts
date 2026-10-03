import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getWikiPage, updateWikiPage, deleteWikiPage } from '@/app/wiki/actions'
import { serializeForApi } from '@/lib/api-utils'
import { UpdateWikiData } from '@/lib/types'

interface RouteContext {
  params: Promise<{
    slug: string
  }>
}

/**
 * GET /api/v1/wiki/:slug
 * Get a single wiki page by slug
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {


    // Get wiki slug
    const { slug } = await context.params

    // Get the wiki page
    const wikiPage = await getWikiPage(slug)

    if (!wikiPage) {
      return createApiError(404, 'Wiki page not found')
    }

    // Return wiki page
    return createApiResponse({
      data: serializeForApi(wikiPage),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PUT /api/v1/wiki/:slug
 * Update a wiki page
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {


    // Get wiki slug
    const { slug } = await context.params

    // Parse body
    const body = await request.json()

    // Build update data
    const updateData: UpdateWikiData = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.summary !== undefined) updateData.summary = body.summary
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished

    // Update the wiki page
    const wikiPage = await updateWikiPage(slug, updateData)

    // Return updated wiki page
    return createApiResponse({
      data: serializeForApi(wikiPage),
    })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * DELETE /api/v1/wiki/:slug
 * Delete a wiki page
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {


    // Get wiki slug
    const { slug } = await context.params

    // Delete the wiki page
    await deleteWikiPage(slug)

    // Return success
    return createApiResponse({
      message: 'Wiki page deleted successfully',
    })
  } catch (error) {
    return handleApiError(error, true)
  }
}
