import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { ApiKeyPermission } from './types'

/**
 * Creates a standard API error response
 */
export function createApiError(status: number, message: string) {
  return Response.json(
    { error: message },
    { status }
  )
}

/**
 * Creates a standard API success response
 */
export function createApiResponse(data: any, status: number = 200) {
  return Response.json(data, { status })
}

/**
 * Hashes an API key for lookup
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Authenticates an API request using Bearer token
 * Checks the apiKeys collection for valid, active keys with required permissions
 *
 * @param request - The Next.js request object
 * @param requiredPermissions - Array of permissions required for this endpoint
 * @returns Authentication result with user info if successful
 */
export async function authenticateApiRequest(
  request: NextRequest,
  requiredPermissions: ApiKeyPermission[] = []
): Promise<{
  authenticated: boolean
  user?: { id: string; name: string; email: string; role: string }
  error?: string
}> {
  try {
    // Get Authorization header
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (!authHeader) {
      return { authenticated: false, error: 'Missing Authorization header' }
    }

    // Parse Bearer token
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return { authenticated: false, error: 'Invalid Authorization header format' }
    }

    const plainApiKey = parts[1]
    const hashedApiKey = hashApiKey(plainApiKey)

    // Look up API key in database
    const { getCollection } = await import('./mongodb')
    const apiKeysCollection = await getCollection('apiKeys')

    const apiKey = await apiKeysCollection.findOne({
      key: hashedApiKey,
      isActive: true,
    })

    if (!apiKey) {
      return { authenticated: false, error: 'Invalid or inactive API key' }
    }

    // Check if key is expired
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { authenticated: false, error: 'API key has expired' }
    }

    // Check permissions
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(
        perm => apiKey.permissions && apiKey.permissions.includes(perm)
      )

      if (!hasAllPermissions) {
        return {
          authenticated: false,
          error: `Missing required permissions: ${requiredPermissions.join(', ')}`
        }
      }
    }

    // Get user info
    const usersCollection = await getCollection('users')
    const user = await usersCollection.findOne({ _id: apiKey.userId })

    if (!user || !user.isActive) {
      return { authenticated: false, error: 'Associated user not found or inactive' }
    }

    // Update last used timestamp
    await apiKeysCollection.updateOne(
      { _id: apiKey._id },
      { $set: { lastUsedAt: new Date() } }
    )

    return {
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }

  } catch (error) {
    console.error('API authentication error:', error)
    return { authenticated: false, error: 'Internal authentication error' }
  }
}
