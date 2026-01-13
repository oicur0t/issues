import { NextRequest } from 'next/server'
import { createApiError, createApiResponse, authenticateApiRequest } from '@/lib/api-auth'
import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { Asset } from '@/lib/types'

/**
 * POST /api/v1/assets/phone-home
 * Asset check-in endpoint for servers to report their status
 * Requires API key with 'assets:write' permission
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate with API key
    const authResult = await authenticateApiRequest(request, ['assets:write'])

    if (!authResult.authenticated || !authResult.user) {
      return createApiError(401, 'Unauthorized - Valid API key with assets:write permission required')
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.hostname) {
      return createApiError(400, 'Bad request - Missing required field: hostname')
    }

    // Extract system information from request
    const systemInfo = {
      hostname: body.hostname,
      ipAddresses: body.ipAddresses || [],
      os: body.os,
      osVersion: body.osVersion,
      kernel: body.kernel,
      architecture: body.architecture,
      cpuModel: body.cpuModel,
      cpuCores: body.cpuCores,
      totalMemory: body.totalMemory,
      diskSpace: body.diskSpace,
      uptime: body.uptime,
      lastCheckIn: new Date(),
    }

    // Get assets collection
    const assetsCollection = await getCollection('assets')

    // Find existing asset by hostname
    let existingAsset = await assetsCollection.findOne({
      hostname: systemInfo.hostname
    })

    // If no asset found by hostname, try to find by IP address
    if (!existingAsset && systemInfo.ipAddresses.length > 0) {
      existingAsset = await assetsCollection.findOne({
        ipAddresses: { $in: systemInfo.ipAddresses }
      })
    }

    let asset: any

    if (existingAsset) {
      // Update existing asset
      const updateData: any = {
        hostname: systemInfo.hostname,
        ipAddresses: systemInfo.ipAddresses,
        os: systemInfo.os || existingAsset.os,
        lastCheckIn: systemInfo.lastCheckIn,
        updatedAt: new Date(),
      }

      // Store detailed system info in a systemInfo field
      updateData.systemInfo = {
        osVersion: systemInfo.osVersion,
        kernel: systemInfo.kernel,
        architecture: systemInfo.architecture,
        cpuModel: systemInfo.cpuModel,
        cpuCores: systemInfo.cpuCores,
        totalMemory: systemInfo.totalMemory,
        diskSpace: systemInfo.diskSpace,
        uptime: systemInfo.uptime,
      }

      await assetsCollection.updateOne(
        { _id: existingAsset._id },
        { $set: updateData }
      )

      asset = await assetsCollection.findOne({ _id: existingAsset._id })
    } else {
      // Create new asset
      const newAsset: Partial<Asset> = {
        name: systemInfo.hostname,
        hostname: systemInfo.hostname,
        ipAddresses: systemInfo.ipAddresses,
        type: 'server',
        status: 'active',
        os: systemInfo.os || 'Unknown',
        provider: body.provider || 'Unknown',
        location: body.location,
        accounts: [],
        description: `Auto-discovered via phone-home on ${new Date().toISOString()}`,
        projects: [],
        tags: ['auto-discovered', 'phone-home'],
        createdBy: new ObjectId(authResult.user.id),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastCheckIn: systemInfo.lastCheckIn,
        systemInfo: {
          osVersion: systemInfo.osVersion,
          kernel: systemInfo.kernel,
          architecture: systemInfo.architecture,
          cpuModel: systemInfo.cpuModel,
          cpuCores: systemInfo.cpuCores,
          totalMemory: systemInfo.totalMemory,
          diskSpace: systemInfo.diskSpace,
          uptime: systemInfo.uptime,
        },
      }

      const result = await assetsCollection.insertOne(newAsset as any)
      asset = await assetsCollection.findOne({ _id: result.insertedId })
    }

    // Return response
    return createApiResponse({
      message: existingAsset ? 'Asset updated successfully' : 'Asset created successfully',
      asset: {
        id: asset._id.toString(),
        hostname: asset.hostname,
        name: asset.name,
        lastCheckIn: asset.lastCheckIn,
      }
    })

  } catch (error) {
    console.error('Phone-home API error:', error)
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error')
  }
}
