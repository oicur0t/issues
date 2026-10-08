'use server'

import { revalidatePath } from 'next/cache'
import { ObjectId } from 'mongodb'
import { getCollection } from '@/lib/mongodb'
import { requireUnifiedAuth as requireAuth } from '@/lib/unified-auth'
import {
  Asset,
  CreateAssetData,
  UpdateAssetData,
  AssetWithProjects,
  AssetFilter
} from '@/lib/types/asset'
import { isEmptyOrWhitespace } from '@/lib/utils'
import { isApiAuthError } from '@/lib/api-errors'

/**
 * Creates a new asset
 * @param data - Asset data to create
 * @returns Promise<Asset> - Created asset
 */
export async function createAsset(data: CreateAssetData): Promise<Asset> {
  try {
    const user = await requireAuth('developer')

    // Validate input
    if (isEmptyOrWhitespace(data.name)) {
      throw new Error('Asset name is required')
    }

    if (!data.type) {
      throw new Error('Asset type is required')
    }

    const assetsCollection = await getCollection('assets')

    // Convert project IDs from strings to ObjectIds
    const projects = data.projects.map(p => {
      if (!ObjectId.isValid(p.projectId)) {
        throw new Error(`Invalid project ID: ${p.projectId}`)
      }
      return {
        projectId: new ObjectId(p.projectId),
        role: p.role.trim()
      }
    })

    const newAsset: Omit<Asset, '_id'> = {
      name: data.name.trim(),
      hostname: data.hostname?.trim(),
      ipAddresses: data.ipAddresses || [],
      type: data.type.trim(),
      status: data.status,
      os: data.os?.trim(),
      provider: data.provider?.trim(),
      location: data.location?.trim(),
      cost: data.cost,
      vendorUrl: data.vendorUrl?.trim(),
      accounts: data.accounts || [],
      customFields: data.customFields || [],
      description: data.description?.trim(),
      projects,
      tags: data.tags || [],
      createdBy: user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await assetsCollection.insertOne(newAsset as any)

    // Revalidate the assets page
    revalidatePath('/assets')
    revalidatePath('/')

    return {
      _id: result.insertedId,
      ...newAsset,
    }
  } catch (error) {
    console.error('Error creating asset:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to create asset')
  }
}

/**
 * Gets all assets with optional filtering
 * @param filter - Optional filter criteria
 * @returns Promise<AssetWithProjects[]> - List of assets with project details
 */
export async function getAssets(filter?: AssetFilter): Promise<AssetWithProjects[]> {
  try {
    const user = await requireAuth('viewer')

    const assetsCollection = await getCollection('assets')
    const projectsCollection = await getCollection('projects')
    const usersCollection = await getCollection('users')

    // Build filter query
    const query: any = {}

    if (filter?.type && filter.type.length > 0) {
      query.type = { $in: filter.type }
    }

    if (filter?.projectId) {
      query['projects.projectId'] = new ObjectId(filter.projectId)
    }

    if (filter?.status && filter.status.length > 0) {
      query.status = { $in: filter.status }
    }

    if (filter?.tags && filter.tags.length > 0) {
      query.tags = { $in: filter.tags }
    }

    if (filter?.provider) {
      query.provider = filter.provider
    }

    if (filter?.location) {
      query.location = filter.location
    }

    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { hostname: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { ipAddresses: { $regex: filter.search, $options: 'i' } },
      ]
    }

    // Get assets
    const assets = await assetsCollection
      .find(query)
      .sort({ name: 1 })
      .toArray()

    // Get all unique project IDs and user IDs
    const projectIds = new Set<string>()
    const userIds = new Set<string>()

    assets.forEach(asset => {
      asset.projects?.forEach((p: any) => projectIds.add(p.projectId.toString()))
      userIds.add(asset.createdBy.toString())
    })

    // Fetch projects and users
    const projects = await projectsCollection
      .find({ _id: { $in: Array.from(projectIds).map(id => new ObjectId(id)) } })
      .toArray()

    const users = await usersCollection
      .find({ _id: { $in: Array.from(userIds).map(id => new ObjectId(id)) } })
      .toArray()

    const projectMap = new Map(projects.map(p => [p._id.toString(), p]))
    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    // Transform assets to include project and creator details
    const assetsWithProjects: AssetWithProjects[] = assets.map(asset => {
      const assetProjects = (asset.projects || [])
        .map((p: any) => {
          const project = projectMap.get(p.projectId.toString())
          return project ? {
            _id: project._id,
            name: project.name,
            key: project.key,
            role: p.role,
          } : null
        })
        .filter(Boolean) as any[]

      const creator = userMap.get(asset.createdBy.toString())

      return {
        ...asset,
        projects: assetProjects,
        creator: creator ? {
          _id: creator._id,
          name: creator.name,
          email: creator.email,
        } : {
          _id: new ObjectId(),
          name: 'Unknown User',
          email: 'unknown@example.com',
        },
      } as AssetWithProjects
    })

    return assetsWithProjects
  } catch (error) {
    console.error('Error getting assets:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get assets')
  }
}

/**
 * Gets a single asset by ID
 * @param id - Asset ID
 * @returns Promise<AssetWithProjects | null> - Asset with project details or null if not found
 */
export async function getAsset(id: string): Promise<AssetWithProjects | null> {
  try {
    const user = await requireAuth('viewer')

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid asset ID')
    }

    const assetsCollection = await getCollection('assets')
    const projectsCollection = await getCollection('projects')
    const usersCollection = await getCollection('users')

    const asset = await assetsCollection.findOne({ _id: new ObjectId(id) })

    if (!asset) {
      return null
    }

    // Get project details
    const projectIds = (asset.projects || []).map((p: any) => p.projectId)
    const projects = await projectsCollection
      .find({ _id: { $in: projectIds } })
      .toArray()

    const projectMap = new Map(projects.map(p => [p._id.toString(), p]))
    const assetProjects = (asset.projects || []).map((p: any) => {
      const project = projectMap.get(p.projectId.toString())
      return project ? {
        _id: project._id,
        name: project.name,
        key: project.key,
        role: p.role,
      } : null
    }).filter(Boolean) as any[]

    // Get creator details
    const creator = await usersCollection.findOne({ _id: asset.createdBy })

    return {
      ...asset,
      projects: assetProjects,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
        email: creator.email,
      } : {
        _id: new ObjectId(),
        name: 'Unknown User',
        email: 'unknown@example.com',
      },
    } as AssetWithProjects
  } catch (error) {
    console.error('Error getting asset:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get asset')
  }
}

/**
 * Updates an existing asset
 * @param id - Asset ID
 * @param data - Updated asset data
 * @returns Promise<Asset> - Updated asset
 */
export async function updateAsset(id: string, data: UpdateAssetData): Promise<Asset> {
  try {
    const user = await requireAuth('developer')

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid asset ID')
    }

    const assetsCollection = await getCollection('assets')

    // Validate input if provided
    if (data.name !== undefined && isEmptyOrWhitespace(data.name)) {
      throw new Error('Asset name cannot be empty')
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (data.name !== undefined) {
      updateData.name = data.name.trim()
    }

    if (data.hostname !== undefined) {
      updateData.hostname = data.hostname?.trim()
    }

    if (data.ipAddresses !== undefined) {
      updateData.ipAddresses = data.ipAddresses
    }

    if (data.type !== undefined) {
      updateData.type = data.type
    }

    if (data.os !== undefined) {
      updateData.os = data.os?.trim()
    }

    if (data.provider !== undefined) {
      updateData.provider = data.provider?.trim()
    }

    if (data.location !== undefined) {
      updateData.location = data.location?.trim()
    }

    // cost: a number sets it, null clears it
    let unsetData: any = undefined
    if (data.cost === null) {
      unsetData = { cost: '' }
    } else if (data.cost !== undefined) {
      updateData.cost = data.cost
    }

    if (data.vendorUrl !== undefined) {
      updateData.vendorUrl = data.vendorUrl?.trim()
    }

    if (data.accounts !== undefined) {
      updateData.accounts = data.accounts
    }

    if (data.customFields !== undefined) {
      updateData.customFields = data.customFields
    }

    if (data.description !== undefined) {
      updateData.description = data.description?.trim()
    }

    if (data.projects !== undefined) {
      updateData.projects = data.projects.map(p => {
        if (!ObjectId.isValid(p.projectId)) {
          throw new Error(`Invalid project ID: ${p.projectId}`)
        }
        return {
          projectId: new ObjectId(p.projectId),
          role: p.role.trim()
        }
      })
    }

    if (data.tags !== undefined) {
      updateData.tags = data.tags
    }

    if (data.status !== undefined) {
      updateData.status = data.status
    }

    const result = await assetsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData, ...(unsetData && { $unset: unsetData }) },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Asset not found')
    }

    // Revalidate paths
    revalidatePath('/assets')
    revalidatePath(`/assets/${id}`)
    revalidatePath('/')

    return result as Asset
  } catch (error) {
    console.error('Error updating asset:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to update asset')
  }
}

/**
 * Deletes an asset
 * @param id - Asset ID
 * @returns Promise<boolean> - True if asset was deleted
 */
export async function deleteAsset(id: string): Promise<boolean> {
  try {
    const user = await requireAuth('developer')

    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid asset ID')
    }

    const assetsCollection = await getCollection('assets')

    const result = await assetsCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      throw new Error('Asset not found')
    }

    // Revalidate paths
    revalidatePath('/assets')
    revalidatePath('/')

    return true
  } catch (error) {
    console.error('Error deleting asset:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to delete asset')
  }
}
