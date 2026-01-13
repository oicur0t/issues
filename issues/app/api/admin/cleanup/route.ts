import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'

/**
 * DELETE /api/admin/cleanup
 * Deletes all issues and resets project counters
 * Admin only endpoint
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAuth('admin')

    const issuesCollection = await getCollection('issues')
    const projectsCollection = await getCollection('projects')

    // Count existing issues
    const issueCount = await issuesCollection.countDocuments()
    console.log(`[Admin Cleanup] Found ${issueCount} issues to delete`)

    // Delete all issues
    const deleteResult = await issuesCollection.deleteMany({})
    console.log(`[Admin Cleanup] Deleted ${deleteResult.deletedCount} issues`)

    // Reset issue counters on all projects
    const resetResult = await projectsCollection.updateMany(
      {},
      { $set: { issueCounter: 0 } }
    )
    console.log(`[Admin Cleanup] Reset issue counters for ${resetResult.modifiedCount} projects`)

    return NextResponse.json({
      success: true,
      message: 'All issues deleted and project counters reset',
      deletedIssues: deleteResult.deletedCount,
      resetProjects: resetResult.modifiedCount,
    })
  } catch (error) {
    console.error('[Admin Cleanup] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup database'
      },
      { status: 500 }
    )
  }
}
