import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { getUsers } from '@/app/users/actions'
import { serializeForApi, parsePaginationParams } from '@/lib/api-utils'

/**
 * GET /api/v1/users
 * List all users
 * Authentication is handled by the action via unified-auth
 */
export async function GET(request: NextRequest) {
  try {
    // Parse pagination
    const searchParams = request.nextUrl.searchParams
    const { limit, offset } = parsePaginationParams(searchParams)

    // Get users (authentication handled by unified-auth in action)
    const users = await getUsers()

    // Apply pagination
    const paginatedUsers = users.slice(offset, offset + limit)

    // Serialize and return
    return createApiResponse({
      data: serializeForApi(paginatedUsers),
      pagination: {
        limit,
        offset,
        total: users.length,
        hasMore: offset + limit < users.length,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, 'Internal server error')
  }
}
