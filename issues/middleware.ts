import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'issue-tracker-session'

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth']

// Routes that should redirect to home if already logged in
const authRoutes = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip authentication for all API routes - they handle their own auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Get session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  const isAuthenticated = !!sessionCookie?.value

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If user is authenticated and trying to access login page, redirect to home
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If user is not authenticated and trying to access protected route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    // Optionally add a redirect parameter to send user back after login
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
