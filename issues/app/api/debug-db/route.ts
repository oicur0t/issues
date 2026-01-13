import { NextRequest, NextResponse } from 'next/server'
import { getCollection } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const projectsCollection = await getCollection('projects')
    const issuesCollection = await getCollection('issues')

    const projects = await projectsCollection.find().toArray()
    const issues = await issuesCollection.find().toArray()

    return NextResponse.json({
      projects: projects.map(p => ({
        _id: p._id?.toString(),
        name: p.name,
        key: p.key,
        issueCounter: p.issueCounter
      })),
      issues: issues.map(i => ({
        _id: i._id?.toString(),
        projectId: i.projectId?.toString(),
        issueNumber: i.issueNumber,
        title: i.title
      })),
      projectCount: projects.length,
      issueCount: issues.length
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
