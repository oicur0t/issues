import { NextRequest } from 'next/server'
import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getIssues, createIssue } from '@/app/issues/actions'
import { serializeForApi, parsePaginationParams } from '@/lib/api-utils'
import { CreateIssueData, IssueFilter } from '@/lib/types'

/**
 * GET /api/v1/issues
 * List all issues with optional filtering
 */
export async function GET(request: NextRequest) {
  try {


    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const { limit, offset } = parsePaginationParams(searchParams)

    // Build filter
    const filter: IssueFilter = {}

    if (searchParams.get('projectId')) {
      filter.projectId = searchParams.get('projectId')!
    }

    if (searchParams.get('status')) {
      filter.status = searchParams.get('status')!.split(',') as any
    }

    if (searchParams.get('priority')) {
      filter.priority = searchParams.get('priority')!.split(',') as any
    }

    if (searchParams.get('assigneeId')) {
      filter.assigneeId = searchParams.get('assigneeId')!
    }

    if (searchParams.get('featureId')) {
      filter.featureId = searchParams.get('featureId')!
    }

    if (searchParams.get('mine') === 'true') {
      filter.mine = true
    }

    if (searchParams.get('tags')) {
      filter.tags = searchParams.get('tags')!.split(',')
    }

    if (searchParams.get('search')) {
      filter.search = searchParams.get('search')!
    }

    // Get issues
    const issues = await getIssues(filter)

    // Apply pagination
    const paginatedIssues = issues.slice(offset, offset + limit)

    // Serialize and return
    return createApiResponse({
      data: serializeForApi(paginatedIssues),
      pagination: {
        limit,
        offset,
        total: issues.length,
        hasMore: offset + limit < issues.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/v1/issues
 * Create a new issue
 */
export async function POST(request: NextRequest) {
  try {


    // Parse body
    const body = await request.json()

    // Validate required fields
    if (!body.projectId || !body.title || !body.description) {
      return createApiError(400, 'Bad request - Missing required fields: projectId, title, description')
    }

    // Create issue data
    const issueData: CreateIssueData = {
      projectId: body.projectId,
      title: body.title,
      description: body.description,
      priority: body.priority || 'medium',
      assigneeId: body.assigneeId,
      tags: body.tags || [],
      featureId: body.featureId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    }

    // Create the issue
    const issue = await createIssue(issueData)

    // Return created issue
    return createApiResponse(
      { data: serializeForApi(issue) },
      201
    )
  } catch (error) {
    return handleApiError(error, true)
  }
}
