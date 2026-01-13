'use server'

import { getCollection } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'

/**
 * Gets comprehensive dashboard statistics
 * @returns Dashboard metrics including issues, projects, users, wiki, and asset stats
 */
export async function getDashboardStats() {
  try {
    const user = await requireAuth('viewer')

    const issuesCollection = await getCollection('issues')
    const projectsCollection = await getCollection('projects')
    const usersCollection = await getCollection('users')
    const wikiCollection = await getCollection('wiki')
    const assetsCollection = await getCollection('assets')

    // Calculate date ranges
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Start of this week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch all stats in parallel
    const [
      // Issue stats
      totalIssues,
      backlogIssues,
      inProgressIssues,
      blockedIssues,
      issuesThisWeek,
      issuesThisMonth,

      // Project stats
      totalProjects,

      // User stats
      totalUsers,
      activeUsers,

      // Wiki stats
      totalWikiPages,
      publishedWikiPages,
      wikiPagesThisWeek,

      // Asset stats
      totalAssets,
      hostAssets,
      containerAssets,
      podAssets,
      integrationAssets,
    ] = await Promise.all([
      // Issues
      issuesCollection.countDocuments(),
      issuesCollection.countDocuments({ status: 'backlog' }),
      issuesCollection.countDocuments({ status: 'in_progress' }),
      issuesCollection.countDocuments({ status: 'blocked' }),
      issuesCollection.countDocuments({
        createdAt: { $gte: startOfWeek }
      }),
      issuesCollection.countDocuments({
        createdAt: { $gte: startOfMonth }
      }),

      // Projects
      projectsCollection.countDocuments(),

      // Users
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ isActive: true }),

      // Wiki
      wikiCollection.countDocuments(),
      wikiCollection.countDocuments({ isPublished: true }),
      wikiCollection.countDocuments({
        createdAt: { $gte: startOfWeek }
      }),

      // Assets
      assetsCollection.countDocuments(),
      assetsCollection.countDocuments({ type: 'host' }),
      assetsCollection.countDocuments({ type: 'container' }),
      assetsCollection.countDocuments({ type: 'pod' }),
      assetsCollection.countDocuments({ type: 'integration' }),
    ])

    return {
      issues: {
        total: totalIssues,
        backlog: backlogIssues,
        inProgress: inProgressIssues,
        blocked: blockedIssues,
        thisWeek: issuesThisWeek,
        thisMonth: issuesThisMonth,
      },
      projects: {
        total: totalProjects,
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
      assets: {
        total: totalAssets,
        byType: {
          host: hostAssets,
          container: containerAssets,
          pod: podAssets,
          integration: integrationAssets,
        },
      },
    }
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get dashboard statistics')
  }
}

/**
 * Gets recent activity for the dashboard
 * @returns Recent issues and wiki pages
 */
export async function getRecentActivity() {
  try {
    const user = await requireAuth('viewer')

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
    throw new Error(error instanceof Error ? error.message : 'Failed to get recent activity')
  }
}
