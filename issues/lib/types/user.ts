import { ObjectId } from 'mongodb'

export type UserRole = 'admin' | 'developer' | 'tester' | 'viewer'

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string // Hashed password (bcrypt)
  role: UserRole
  avatar?: string
  apiKey: string // Hashed API key
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

export interface CreateUserData {
  name: string
  email: string
  password: string
  role: UserRole
  avatar?: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: UserRole
  avatar?: string
  isActive?: boolean
}

export interface UserSession {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  }
  isLoggedIn: boolean
}

export interface AuthUser {
  _id: ObjectId
  name: string
  email: string
  role: UserRole
  avatar?: string
  isActive: boolean
}