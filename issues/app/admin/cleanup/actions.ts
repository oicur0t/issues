'use server'

import { getCollection } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import { isApiAuthError } from '@/lib/api-errors'

export async function cleanupOrphanedIssues() {
  try {
    await requireAuth('admin')

    const issuesCollection = await getCollection('issues')
    const projectsCollection = await getCollection('projects')

    // Get all issues
    const issues = await issuesCollection.find().toArray()
    console.log(`Found ${issues.length} issues`)

    // Get all valid project IDs
    const projects = await projectsCollection.find().toArray()
    const validProjectIds = new Set(projects.map(p => p._id.toString()))
    console.log(`Found ${projects.length} valid projects`)

    // Find orphaned issues
    const orphanedIssues = issues.filter(issue => !validProjectIds.has(issue.projectId.toString()))
    console.log(`Found ${orphanedIssues.length} orphaned issues`)

    if (orphanedIssues.length > 0) {
      console.log('Orphaned issue IDs:', orphanedIssues.map(i => i._id.toString()))

      // Delete orphaned issues
      const result = await issuesCollection.deleteMany({
        _id: { $in: orphanedIssues.map(i => i._id) }
      })

      console.log(`Deleted ${result.deletedCount} orphaned issues`)

      return {
        success: true,
        deletedCount: result.deletedCount,
        orphanedIds: orphanedIssues.map(i => i._id.toString())
      }
    }

    return {
      success: true,
      deletedCount: 0,
      orphanedIds: []
    }
  } catch (error) {
    console.error('Error cleaning up orphaned issues:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to cleanup orphaned issues')
  }
}
