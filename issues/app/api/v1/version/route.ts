import { createApiResponse } from '@/lib/api-auth'

/**
 * GET /api/v1/version
 * Returns the build number of the running app. Unauthenticated on purpose so
 * deploys and agents can check which build is live.
 */
export async function GET() {
  return createApiResponse({
    data: { build: process.env.NEXT_PUBLIC_BUILD_NUMBER },
  })
}
