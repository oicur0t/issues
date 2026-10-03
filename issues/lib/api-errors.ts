import { createApiError } from './api-auth'

/**
 * Typed error thrown by auth helpers (requireUnifiedAuth and friends) so API
 * route handlers can map it to the correct HTTP status instead of a blanket
 * 500. Message is safe to return to the client.
 */
export class ApiAuthError extends Error {
  constructor(
    message: string,
    readonly status: number = 401
  ) {
    super(message)
    this.name = 'ApiAuthError'
  }
}

/**
 * Brand check instead of instanceof: Next bundles 'use server' action modules
 * into a separate layer, so an ApiAuthError thrown there is a different class
 * instance than the one route handlers import.
 */
export function isApiAuthError(error: unknown): error is ApiAuthError {
  return (
    error instanceof Error &&
    error.name === 'ApiAuthError' &&
    typeof (error as ApiAuthError).status === 'number'
  )
}

/**
 * Maps an error caught in an API route handler to a Response with the correct
 * status: auth failures become 401/403, everything else a 500. exposeMessage
 * preserves the per-route behaviour of returning the thrown message.
 */
export function handleApiError(error: unknown, exposeMessage = false): Response {
  if (isApiAuthError(error)) {
    console.warn('API auth error:', error.message)
    return createApiError(error.status, error.message)
  }
  console.error('API error:', error)
  const message = exposeMessage && error instanceof Error ? error.message : 'Internal server error'
  return createApiError(500, message)
}
