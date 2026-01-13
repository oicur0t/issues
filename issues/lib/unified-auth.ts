/**
 * Unified Authentication System
 * Supports both session-based auth (UI) and API key auth (API endpoints)
 */

import { headers } from 'next/headers'
import { ObjectId } from 'mongodb'
import { UserRole, AuthUser } from './types'
import { getCurrentUser } from './auth'
import crypto from 'crypto'

export interface AuthContext {
  user: AuthUser
  source: 'session' | 'api-key'
}

/**
 * Hashes an API key for lookup
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Gets authentication context from either session or API key
 * Checks API key first (from Authorization header), then falls back to session
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    // Check for API key authentication first
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (authHeader) {
      const parts = authHeader.split(' ')
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        const plainApiKey = parts[1]

        // Hash the API key and look up user
        const hashedApiKey = hashApiKey(plainApiKey)
        const { getCollection } = await import('./mongodb')
        const usersCollection = await getCollection('users')
        const user = await usersCollection.findOne({ apiKey: hashedApiKey, isActive: true })

        if (user) {
          return {
            user: {
              _id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
            },
            source: 'api-key',
          }
        }
      }
    }

    // Fall back to session authentication
    const sessionUser = await getCurrentUser()
    if (sessionUser) {
      return {
        user: sessionUser,
        source: 'session',
      }
    }

    return null
  } catch (error) {
    console.error('Error in getAuthContext:', error)
    return null
  }
}

/**
 * Requires authentication with optional role check
 * Works with both session and API key authentication
 *
 * @param requiredRole - Minimum role required
 * @returns Promise<AuthUser> - Authenticated user
 * @throws Error - If not authenticated or insufficient permissions
 */
export async function requireUnifiedAuth(requiredRole: UserRole = 'viewer'): Promise<AuthUser> {
  const context = await getAuthContext()

  if (!context) {
    throw new Error('Authentication required')
  }

  // Check role hierarchy
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    tester: 2,
    developer: 3,
    admin: 4,
  }

  const userRoleLevel = roleHierarchy[context.user.role]
  const requiredRoleLevel = roleHierarchy[requiredRole]

  if (userRoleLevel < requiredRoleLevel) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}, user role: ${context.user.role}`)
  }

  return context.user
}

/**
 * Checks if current context has required role
 */
export async function hasUnifiedRole(requiredRole: UserRole): Promise<boolean> {
  try {
    const context = await getAuthContext()
    if (!context) return false

    const roleHierarchy: Record<UserRole, number> = {
      viewer: 1,
      tester: 2,
      developer: 3,
      admin: 4,
    }

    return roleHierarchy[context.user.role] >= roleHierarchy[requiredRole]
  } catch {
    return false
  }
}
