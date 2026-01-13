import { getCurrentSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/app/users/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiKeyDisplay } from './components/ApiKeyDisplay'
import { User, KeyRound, Mail, Shield, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    console.log('[Profile] No session, redirecting to login')
    redirect('/login')
  }

  console.log('[Profile] Session found for user:', session.user.email)

  let user
  try {
    user = await getCurrentUserProfile()
    console.log('[Profile] User profile loaded:', user?.email)
  } catch (error) {
    console.error('[Profile] Error getting user profile:', error)
    redirect('/login')
  }

  if (!user) {
    console.log('[Profile] No user returned, redirecting to login')
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div className="border-4 border-black p-6 bg-secondary" style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}>
        <h1 className="text-5xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
          <User className="h-12 w-12" />
          Profile
        </h1>
        <p className="text-lg font-bold text-foreground/80 mt-2">
          Manage your account settings and API access.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* API Key Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                API Key
              </CardTitle>
              <CardDescription>
                Your personal API key for programmatic access. Keep it secure and never share it publicly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeyDisplay apiKey={user.apiKey} />
            </CardContent>
          </Card>

          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Learn how to use your API key to access issues, projects, and wiki pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Include your API key in the Authorization header:
                </p>
                <pre className="bg-muted p-4 border-4 border-black text-sm overflow-x-auto font-mono">
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </pre>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Base URL</h3>
                <pre className="bg-muted p-4 border-4 border-black text-sm overflow-x-auto font-mono">
                  <code>{typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/v1</code>
                </pre>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Endpoints</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-mono bg-accent px-2 py-1 border-2 border-black text-xs font-black">GET</span>
                    <span className="font-mono font-bold">/issues</span>
                    <span className="text-muted-foreground">- List all issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono bg-accent px-2 py-1 border-2 border-black text-xs font-black">POST</span>
                    <span className="font-mono font-bold">/issues</span>
                    <span className="text-muted-foreground">- Create a new issue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono bg-accent px-2 py-1 border-2 border-black text-xs font-black">GET</span>
                    <span className="font-mono font-bold">/projects</span>
                    <span className="text-muted-foreground">- List all projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono bg-accent px-2 py-1 border-2 border-black text-xs font-black">POST</span>
                    <span className="font-mono font-bold">/projects</span>
                    <span className="text-muted-foreground">- Create a new project</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono bg-accent px-2 py-1 border-2 border-black text-xs font-black">GET</span>
                    <span className="font-mono font-bold">/wiki</span>
                    <span className="text-muted-foreground">- List all wiki pages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-mono bg-accent px-2 py-1 border-2 border-black text-xs font-black">POST</span>
                    <span className="font-mono font-bold">/wiki</span>
                    <span className="text-muted-foreground">- Create a new wiki page</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </h4>
                <p className="text-sm text-muted-foreground">{user.name}</p>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </h4>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </h4>
                <span className={`inline-block px-3 py-1 text-xs font-black border-3 border-black ${
                  user.role === 'admin' ? 'bg-destructive text-white' :
                  user.role === 'developer' ? 'bg-primary text-white' :
                  user.role === 'tester' ? 'bg-secondary text-black' :
                  'bg-muted text-black'
                }`} style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}>
                  {user.role.toUpperCase()}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
