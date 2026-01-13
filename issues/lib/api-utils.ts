import { ObjectId } from 'mongodb'

/**
 * Converts MongoDB ObjectIds to strings for JSON serialization
 * @param obj - The object to serialize
 * @returns The serialized object with ObjectIds converted to strings
 */
export function serializeForApi(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (obj instanceof ObjectId) {
    return obj.toString()
  }

  if (obj instanceof Date) {
    return obj.toISOString()
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeForApi)
  }

  if (typeof obj === 'object') {
    const serialized: any = {}
    for (const key in obj) {
      serialized[key] = serializeForApi(obj[key])
    }
    return serialized
  }

  return obj
}

/**
 * Parses pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  limit: number
  offset: number
} {
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 items
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

  return { limit, offset }
}
