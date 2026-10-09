'use server'

import { getCollection } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import { isApiAuthError } from '@/lib/api-errors'
import { buildProjectStats, countAssetsPerProject, summarizeAssets } from '@/lib/dashboard'

/**
 * Gets comprehensive dashboard statistics
 * @returns Dashboard metrics: totals, per-project numbers, features, wiki, users and asset health
 */
export async function getDashboardStats() {
  try {
    await requireAuth('viewer')

    const issuesCollection = await getCollection('issues')
    const projectsCollection = await getCollection('projects')
    const usersCollection = await getCollection('users')
    const wikiCollection = await getCollection('wiki')
    const assetsCollection = await getCollection('assets')
    const featuresCollection = await getCollection('features')

    // Calculate date ranges
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of this week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const groupByProjectAndStatus = [
      { $group: { _id: { projectId: '$projectId', status: '$status' }, count: { $sum: 1 } } },
    ]

    // Fetch all stats in parallel
    const [
      totalIssues,
      issuesThisWeek,
      issuesThisMonth,
      projects,
      issueRows,
      featureRows,
      totalUsers,
      activeUsers,
      totalWikiPages,
      publishedWikiPages,
      wikiPagesThisWeek,
      assets,
    ] = await Promise.all([
      issuesCollection.countDocuments(),
      issuesCollection.countDocuments({ createdAt: { $gte: startOfWeek } }),
      issuesCollection.countDocuments({ createdAt: { $gte: startOfMonth } }),
      projectsCollection.find({}, { projection: { name: 1, key: 1 } }).sort({ key: 1 }).toArray(),
      issuesCollection.aggregate(groupByProjectAndStatus).toArray(),
      featuresCollection.aggregate(groupByProjectAndStatus).toArray(),
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ isActive: true }),
      wikiCollection.countDocuments(),
      wikiCollection.countDocuments({ isPublished: true }),
      wikiCollection.countDocuments({ createdAt: { $gte: startOfWeek } }),
      assetsCollection
        .find({}, { projection: { type: 1, status: 1, needsReview: 1, 'tailscale.warnings': 1, 'projects.projectId': 1 } })
        .toArray(),
    ])

    const toRows = (rows: any[]) =>
      rows.map(r => ({ projectId: r._id.projectId, status: r._id.status as string, count: r.count as number }))

    const projectStats = buildProjectStats(
      projects as any,
      toRows(issueRows),
      toRows(featureRows),
      countAssetsPerProject(assets as any)
    )

    // Whole-system numbers are derived from the same grouped rows so totals and per-project cards agree
    const sumStatus = (rows: ReturnType<typeof toRows>, status: string) =>
      rows.filter(r => r.status === status).reduce((n, r) => n + r.count, 0)
    const issueCounts = toRows(issueRows)
    const featureCounts = toRows(featureRows)

    return {
      issues: {
        total: totalIssues,
        backlog: sumStatus(issueCounts, 'backlog'),
        inProgress: sumStatus(issueCounts, 'in_progress'),
        blocked: sumStatus(issueCounts, 'blocked'),
        fixed: sumStatus(issueCounts, 'fixed'),
        thisWeek: issuesThisWeek,
        thisMonth: issuesThisMonth,
      },
      features: {
        total: featureCounts.reduce((n, r) => n + r.count, 0),
        proposed: sumStatus(featureCounts, 'proposed'),
        planned: sumStatus(featureCounts, 'planned'),
        inProgress: sumStatus(featureCounts, 'in_progress'),
        shipped: sumStatus(featureCounts, 'shipped'),
        dropped: sumStatus(featureCounts, 'dropped'),
      },
      projects: {
        total: projects.length,
        items: projectStats,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      wiki: {
        total: totalWikiPages,
        published: publishedWikiPages,
        thisWeek: wikiPagesThisWeek,
      },
      assets: summarizeAssets(assets as any),
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get dashboard statistics')
  }
}

/**
 * Gets recent activity for the dashboard
 * @returns Recent issues and wiki pages
 */
export async function getRecentActivity() {
  try {
    await requireAuth('viewer')

    const issuesCollection = await getCollection('issues')
    const wikiCollection = await getCollection('wiki')

    const [recentIssues, recentWikiPages] = await Promise.all([
      issuesCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray(),
      wikiCollection
        .find({ isPublished: true })
        .sort({ updatedAt: -1 })
        .limit(5)
        .toArray(),
    ])

    return {
      recentIssues,
      recentWikiPages,
    }
  } catch (error) {
    console.error('Error getting recent activity:', error)
    throw isApiAuthError(error) ? error : new Error(error instanceof Error ? error.message : 'Failed to get recent activity')
  }
}
