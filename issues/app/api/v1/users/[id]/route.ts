import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { getUser } from '@/app/users/actions'
import { serializeForApi } from '@/lib/api-utils'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/users/:id
 * Get a single user by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {

    // Get user ID
    const { id } = await context.params

    // Get the user
    const user = await getUser(id)

    if (!user) {
      return createApiError(404, 'User not found')
    }

    // Return user
    return createApiResponse({
      data: serializeForApi(user),
    })
  } catch (error) {
    console.error('API error:', error)
    return createApiError(500, 'Internal server error')
  }
}
