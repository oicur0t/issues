'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCollection } from '@/lib/mongodb'
import bcrypt from 'bcrypt'

const SESSION_COOKIE_NAME = 'issue-tracker-session'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

type AuthResult = {
  success: boolean
  error?: string
}

export async function authenticateUser(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  try {
    // Find user in database by email
    const usersCollection = await getCollection('users')
    const user = await usersCollection.findOne({
      email: email.toLowerCase().trim(),
      isActive: true
    })

    console.log("[Login] Found user in DB:", user ? user._id.toString() : "null", user ? user.email : "")

    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Validate password
    if (!user.password) {
      return { success: false, error: 'Your account needs to be updated. Please contact an administrator.' }
    }

    const passwordValid = await bcrypt.compare(password, user.password)
    if (!passwordValid) {
      console.log("[Login] Invalid password for user:", user.email)
      return { success: false, error: 'Invalid email or password' }
    }

    console.log("[Login] Password validated, creating session with user ID:", user._id.toString())

    // Create session
    const session = {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      isLoggedIn: true
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.PROTOCOL === 'https',
      sameSite: 'lax',
      maxAge: SESSION_DURATION,
      path: '/',
    })

    redirect('/')
  } catch (error) {
    // Check if it's a Next.js redirect error
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      // Re-throw the redirect error to allow Next.js to handle it
      throw error
    }

    console.error('Authentication error:', error)
    return { success: false, error: 'An error occurred during login. Please try again.' }
  }
}
