import { createApiError, createApiResponse } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-errors'
import { getTailscaleStatus, syncTailscaleNow } from '@/app/assets/tailscale-actions'
import { serializeForApi } from '@/lib/api-utils'

/**
 * GET /api/v1/assets/tailscale-sync
 * Whether the Tailscale sync is configured, and the outcome of the last run
 */
export async function GET() {
  try {
    const status = await getTailscaleStatus()
    return createApiResponse({ data: serializeForApi(status) })
  } catch (error) {
    return handleApiError(error, true)
  }
}

/**
 * POST /api/v1/assets/tailscale-sync
 * Run a sync now. Returns what changed. A failed run changes nothing.
 */
export async function POST() {
  try {
    const result = await syncTailscaleNow()
    if (!result.ok) {
      return createApiError(result.status, result.error)
    }
    return createApiResponse({ data: serializeForApi(result.summary) })
  } catch (error) {
    return handleApiError(error, true)
  }
}
