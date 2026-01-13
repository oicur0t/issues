import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const issuesCollection = await getCollection('issues')
    const projectsCollection = await getCollection('projects')

    // Get all issues
    const issues = await issuesCollection.find().toArray()
    console.log(`Found ${issues.length} total issues`)

    // Get all valid project IDs
    const projects = await projectsCollection.find().toArray()
    const validProjectIds = new Set(projects.map(p => p._id.toString()))
    console.log(`Found ${projects.length} valid projects:`, Array.from(validProjectIds))

    // Find orphaned issues
    const orphanedIssues = issues.filter(issue => {
      const projectIdStr = issue.projectId.toString()
      const isOrphaned = !validProjectIds.has(projectIdStr)
      if (isOrphaned) {
        console.log(`Issue ${issue._id} references invalid project ${projectIdStr}`)
      }
      return isOrphaned
    })

    console.log(`Found ${orphanedIssues.length} orphaned issues`)

    if (orphanedIssues.length > 0) {
      // Delete orphaned issues
      const result = await issuesCollection.deleteMany({
        _id: { $in: orphanedIssues.map(i => i._id) }
      })

      console.log(`Deleted ${result.deletedCount} orphaned issues`)

      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        orphanedIds: orphanedIssues.map(i => i._id.toString())
      })
    }

    return NextResponse.json({
      success: true,
      deletedCount: 0,
      message: 'No orphaned issues found'
    })
  } catch (error) {
    console.error('Error cleaning up database:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cleanup' },
      { status: 500 }
    )
  }
}
