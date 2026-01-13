import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { UserSession, UserRole, AuthUser } from './types'

const MOCK_USER: AuthUser = {
  _id: new ObjectId('507f1f77bcf86cd799439011'), // Mock ObjectId
  name: process.env.MOCK_USER_NAME || 'Admin User',
  email: process.env.MOCK_USER_EMAIL || 'admin@example.com',
  role: (process.env.MOCK_USER_ROLE as UserRole) || 'admin',
  isActive: true,
}

const SESSION_COOKIE_NAME = 'issue-tracker-session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

/**
 * Creates a mock user session for development
 * @param email - User email (for mock authentication, any email works)
 * @param password - User password (for mock authentication, any password works)
 * @returns Promise<UserSession> - User session data
 */
export async function mockLogin(email: string, password: string): Promise<UserSession> {
  // In a real application, you would validate credentials against the database
  // For mock authentication, we accept any credentials and return the mock user
  
  const session: UserSession = {
    user: {
      id: MOCK_USER._id.toString(),
      name: MOCK_USER.name,
      email: MOCK_USER.email,
      role: MOCK_USER.role,
    },
    isLoggedIn: true,
  }

  try {
    // Set session cookie
    const cookieStore = await cookies()
    
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.PROTOCOL === 'https',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    })
  } catch (error) {
    console.error('Error setting session cookie:', error)
    throw error
  }

  return session
}

/**
 * Logs out the current user by clearing the session cookie
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Gets the current user session from cookies
 * @returns Promise<UserSession | null> - Current user session or null if not logged in
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    try {
      const session: UserSession = JSON.parse(sessionCookie.value)
      return session
    } catch (error) {
      console.error('Error parsing session cookie:', error)
      return null
    }
  } catch (error) {
    console.error('Error in getCurrentSession:', error)
    return null
  }
}

/**
 * Gets the current authenticated user from the database
 * @returns Promise<AuthUser | null> - Current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    return null
  }

  // Fetch the actual user from the database
  try {
    const { getCollection } = await import('./mongodb')
    const usersCollection = await getCollection('users')

    const user = await usersCollection.findOne({
      _id: new ObjectId(session.user.id)
    })

    if (!user) {
      return null
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    } as AuthUser
  } catch (error) {
    console.error('Error fetching user from database:', error)
    return null
  }
}

/**
 * Checks if the current user has the required role
 * @param requiredRole - Minimum role required
 * @returns Promise<boolean> - True if user has required role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }

  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    tester: 2,
    developer: 3,
    admin: 4,
  }

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

/**
 * Middleware to protect routes that require authentication
 * @param requiredRole - Minimum role required to access the route
 * @returns Promise<AuthUser> - Authenticated user
 * @throws Error - If user is not authenticated or doesn't have required role
 */
export async function requireAuth(requiredRole: UserRole = 'viewer'): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  if (!(await hasRole(requiredRole))) {
    throw new Error(`Insufficient permissions. Required role: ${requiredRole}`)
  }

  return user
}

/**
 * Mock function to create a user in the database
 * In a real application, this would insert a user into the database
 * @param userData - User data to create
 * @returns Promise<AuthUser> - Created user
 */
export async function createMockUser(userData: {
  name: string
  email: string
  role: UserRole
}): Promise<AuthUser> {
  // This is a mock function - in a real app, you'd insert into MongoDB
  return {
    _id: new ObjectId(),
    ...userData,
    isActive: true,
  }
}

