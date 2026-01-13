'use server'

import { requireUnifiedAuth } from '@/lib/unified-auth'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import { ApiKeyPermission } from '@/lib/types'

/**
 * Generates a random API key
 */
function generateApiKey(): string {
  return 'iak_' + crypto.randomBytes(32).toString('hex')
}

/**
 * Hashes an API key for storage
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Create a new API key
 * Returns the plain-text key (only shown once!)
 */
export async function createApiKey(data: {
  name: string
  permissions: ApiKeyPermission[]
  expiresAt?: Date
}): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    // Require admin role
    const user = await requireUnifiedAuth('admin')

    // Generate API key
    const plainKey = generateApiKey()
    const hashedKey = hashApiKey(plainKey)

    // Create API key document
    const apiKeysCollection = await getCollection('apiKeys')
    await apiKeysCollection.insertOne({
      name: data.name,
      key: hashedKey,
      userId: new ObjectId(user._id),
      permissions: data.permissions,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    })

    return { success: true, key: plainKey }
  } catch (error) {
    console.error('Error creating API key:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create API key' }
  }
}

/**
 * List all API keys (without the actual key values)
 */
export async function listApiKeys(): Promise<any[]> {
  try {
    await requireUnifiedAuth('admin')

    const apiKeysCollection = await getCollection('apiKeys')
    const usersCollection = await getCollection('users')

    const keys = await apiKeysCollection.find({}).sort({ createdAt: -1 }).toArray()

    // Enrich with user info
    const enrichedKeys = await Promise.all(
      keys.map(async (key) => {
        const user = await usersCollection.findOne({ _id: key.userId })
        return {
          _id: key._id.toString(),
          name: key.name,
          permissions: key.permissions,
          isActive: key.isActive,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt,
          createdAt: key.createdAt,
          user: user ? { name: user.name, email: user.email } : null,
          // Mask the key - never return it
          keyPreview: '••••••••',
        }
      })
    )

    return enrichedKeys
  } catch (error) {
    console.error('Error listing API keys:', error)
    return []
  }
}

/**
 * Delete an API key
 */
export async function deleteApiKey(keyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireUnifiedAuth('admin')

    const apiKeysCollection = await getCollection('apiKeys')
    const result = await apiKeysCollection.deleteOne({ _id: new ObjectId(keyId) })

    if (result.deletedCount === 0) {
      return { success: false, error: 'API key not found' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting API key:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete API key' }
  }
}

/**
 * Toggle API key active status
 */
export async function toggleApiKeyStatus(keyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireUnifiedAuth('admin')

    const apiKeysCollection = await getCollection('apiKeys')
    const key = await apiKeysCollection.findOne({ _id: new ObjectId(keyId) })

    if (!key) {
      return { success: false, error: 'API key not found' }
    }

    await apiKeysCollection.updateOne(
      { _id: new ObjectId(keyId) },
      { $set: { isActive: !key.isActive, updatedAt: new Date() } }
    )

    return { success: true }
  } catch (error) {
    console.error('Error toggling API key status:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to toggle API key status' }
  }
}
