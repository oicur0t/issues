import { ObjectId } from 'mongodb'

export interface ApiKey {
  _id?: ObjectId
  name: string
  key: string // The actual API key (hashed in DB)
  userId: ObjectId
  permissions: ApiKeyPermission[]
  lastUsedAt?: Date
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export type ApiKeyPermission =
  | 'projects:read'
  | 'projects:write'
  | 'issues:read'
  | 'issues:write'
  | 'wiki:read'
  | 'wiki:write'
  | 'users:read'
  | 'assets:read'
  | 'assets:write'

export interface CreateApiKeyData {
  name: string
  permissions: ApiKeyPermission[]
  expiresAt?: Date
}

export interface ApiKeyWithUser extends ApiKey {
  user: {
    _id: ObjectId
    name: string
    email: string
  }
}
