'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import {
  User,
  CreateUserData,
  UpdateUserData,
  UserRole
} from '@/lib/types'
import { isEmptyOrWhitespace, isValidEmail } from '@/lib/utils'
import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { isApiAuthError } from '@/lib/api-errors'

const SALT_ROUNDS = 12

/**
 * Generates a secure random API key
 */
function generateApiKey(): string {
  return `iak_${crypto.randomBytes(32).toString('hex')}`
}

/**
 * Hashes an API key for secure storage
 */
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

/**
 * Creates a new user
 * @param data - User data to create
 * @returns Promise<{ user: User, apiKey: string }> - Created user and their plain API key
 */
export async function createUser(data: CreateUserData): Promise<{ user: User, apiKey: string }> {
  try {
    const user = await requireAuth('admin')

    // Validate input
    if (isEmptyOrWhitespace(data.name)) {
      throw new Error('User name is required')
    }

    if (isEmptyOrWhitespace(data.email)) {
      throw new Error('User email is required')
    }

    if (!isValidEmail(data.email)) {
      throw new Error('Invalid email format')
    }

    if (isEmptyOrWhitespace(data.password)) {
      throw new Error('Password is required')
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }

    const usersCollection = await getCollection('users')

    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email: data.email.trim() })
    if (existingUser) {
      throw new Error('A user with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS)

    // Generate API key
    const plainApiKey = generateApiKey()
    const hashedApiKey = hashApiKey(plainApiKey)

    const newUser: Omit<User, '_id'> = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      role: data.role,
      avatar: data.avatar?.trim(),
      apiKey: hashedApiKey,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    const result = await usersCollection.insertOne(newUser as any)

    // Revalidate the users page
    revalidatePath('/users')

    return {
      user: {
        _id: result.insertedId,
        ...newUser,
      },
      apiKey: plainApiKey, // Return plain key only once
    }
  } catch (error) {
    console.error('Error creating user:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to create user')
  }
}

/**
 * Gets all users
 * @returns Promise<User[]> - List of users
 */
export async function getUsers(): Promise<User[]> {
  try {
    const user = await requireAuth('admin')
    
    const usersCollection = await getCollection('users')
    
    const users = await usersCollection
      .find({})
      .sort({ name: 1 })
      .toArray()
    
    return users as User[]
  } catch (error) {
    console.error('Error getting users:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get users')
  }
}

/**
 * Gets a single user by ID
 * @param id - User ID
 * @returns Promise<User | null> - User or null if not found
 */
export async function getUser(id: string): Promise<User | null> {
  try {
    const user = await requireAuth('admin')
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid user ID')
    }
    
    const usersCollection = await getCollection('users')
    
    const foundUser = await usersCollection.findOne({ _id: new ObjectId(id) })
    
    return foundUser as User | null
  } catch (error) {
    console.error('Error getting user:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get user')
  }
}

/**
 * Updates an existing user
 * @param id - User ID
 * @param data - Updated user data
 * @returns Promise<User> - Updated user
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  try {
    const currentUser = await requireAuth('admin')
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid user ID')
    }
    
    const usersCollection = await getCollection('users')
    
    // Validate input if provided
    if (data.name !== undefined && isEmptyOrWhitespace(data.name)) {
      throw new Error('User name cannot be empty')
    }
    
    if (data.email !== undefined) {
      if (isEmptyOrWhitespace(data.email)) {
        throw new Error('User email cannot be empty')
      }
      
      if (!isValidEmail(data.email)) {
        throw new Error('Invalid email format')
      }
    }
    
    // Check if email already exists (if email is being updated)
    if (data.email) {
      const existingUser = await usersCollection.findOne({ 
        email: data.email.trim().toLowerCase(),
        _id: { $ne: new ObjectId(id) }
      })
      if (existingUser) {
        throw new Error('A user with this email already exists')
      }
    }
    
    // Prevent user from deactivating themselves
    if (id === currentUser._id.toString() && data.isActive === false) {
      throw new Error('You cannot deactivate your own account')
    }
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }
    
    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }
    
    if (data.email !== undefined) {
      updateData.email = data.email.trim().toLowerCase()
    }
    
    if (data.role !== undefined) {
      updateData.role = data.role
    }
    
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar?.trim()
    }
    
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive
    }
    
    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
    
    if (!result || !result.value) {
      throw new Error('User not found')
    }
    
    // Revalidate paths
    revalidatePath('/users')
    revalidatePath(`/users/${id}`)
    
    return result.value
  } catch (error) {
    console.error('Error updating user:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to update user')
  }
}

/**
 * Deletes a user
 * @param id - User ID
 * @returns Promise<boolean> - True if user was deleted
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const currentUser = await requireAuth('admin')
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid user ID')
    }
    
    // Prevent user from deleting themselves
    if (id === currentUser._id.toString()) {
      throw new Error('You cannot delete your own account')
    }
    
    const usersCollection = await getCollection('users')
    
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) })
    
    if (result.deletedCount === 0) {
      throw new Error('User not found')
    }
    
    // Revalidate paths
    revalidatePath('/users')
    
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to delete user')
  }
}

/**
 * Gets user statistics for the dashboard
 * @returns Promise<Object> - User statistics
 */
export async function getUserStats(): Promise<{
  total: number
  active: number
  inactive: number
  byRole: Record<UserRole, number>
}> {
  try {
    const user = await requireAuth('admin')
    
    const usersCollection = await getCollection('users')
    
    const [total, active, inactive, adminUsers, developerUsers, testerUsers, viewerUsers] = await Promise.all([
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ isActive: true }),
      usersCollection.countDocuments({ isActive: false }),
      usersCollection.countDocuments({ role: 'admin' }),
      usersCollection.countDocuments({ role: 'developer' }),
      usersCollection.countDocuments({ role: 'tester' }),
      usersCollection.countDocuments({ role: 'viewer' }),
    ])
    
    return {
      total,
      active,
      inactive,
      byRole: {
        admin: adminUsers,
        developer: developerUsers,
        tester: testerUsers,
        viewer: viewerUsers,
      },
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get user statistics')
  }
}

/**
 * Gets users that can be assigned to issues (active users)
 * @returns Promise<User[]> - List of active users
 */
export async function getAssignableUsers(): Promise<User[]> {
  try {
    const user = await requireAuth('viewer')

    const usersCollection = await getCollection('users')

    const users = await usersCollection
      .find({ isActive: true })
      .sort({ name: 1 })
      .toArray()

    return users as User[]
  } catch (error) {
    console.error('Error getting assignable users:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get assignable users')
  }
}

/**
 * Regenerates API key for a user
 * @param userId - User ID to regenerate API key for
 * @returns Promise<string> - New plain API key
 */
export async function regenerateApiKey(userId: string): Promise<string> {
  try {
    const currentUser = await requireAuth('admin')

    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID')
    }

    const usersCollection = await getCollection('users')

    // Generate new API key
    const plainApiKey = generateApiKey()
    const hashedApiKey = hashApiKey(plainApiKey)

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      {
        $set: {
          apiKey: hashedApiKey,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('User not found')
    }

    revalidatePath('/users')
    revalidatePath(`/users/${userId}`)

    return plainApiKey
  } catch (error) {
    console.error('Error regenerating API key:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to regenerate API key')
  }
}
/**
 * Gets the current user's full profile (including API key hash)
 * @returns Promise<User | null> - Current user's full profile
 */
export async function getCurrentUserProfile(): Promise<User | null> {
  try {
    const currentUser = await requireAuth('viewer')
    
    const usersCollection = await getCollection('users')
    
    console.log("[getCurrentUserProfile] Looking for user with _id:", currentUser._id, "type:", typeof currentUser._id)
    const user = await usersCollection.findOne({ _id: currentUser._id })
    
    console.log("[getCurrentUserProfile] Found user:", user ? user.email : "null")
    return user as User | null
  } catch (error) {
    console.error('Error getting current user profile:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get user profile')
  }
}

/**
 * Regenerates API key for the current user
 * @returns Promise<string> - New plain API key
 */
export async function regenerateMyApiKey(): Promise<string> {
  try {
    const currentUser = await requireAuth('viewer')

    const usersCollection = await getCollection('users')

    // Generate new API key
    const plainApiKey = generateApiKey()
    const hashedApiKey = hashApiKey(plainApiKey)

    const result = await usersCollection.findOneAndUpdate(
      { _id: currentUser._id },
      {
        $set: {
          apiKey: hashedApiKey,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('User not found')
    }

    revalidatePath('/profile')

    return plainApiKey
  } catch (error) {
    console.error('Error regenerating API key:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to regenerate API key')
  }
}
