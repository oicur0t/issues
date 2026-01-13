import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentSession } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CleanupButton } from './CleanupButton'
import { RecalculateCountersButton } from './RecalculateCountersButton'
import { AlertTriangle, Key } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black p-6 bg-secondary" style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}>
        <h1 className="text-5xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
          <AlertTriangle className="h-12 w-12" />
          Admin Tools
        </h1>
        <p className="text-lg font-bold text-foreground/80 mt-2">
          Dangerous operations - use with caution
        </p>
      </div>

      {/* Service API Keys */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center gap-2">
            <Key className="h-8 w-8" />
            Service API Keys
          </CardTitle>
          <CardDescription>
            Manage API keys for services and automated systems (phone-home, CI/CD, scripts)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/admin/api-keys">
            <Button>
              Manage API Keys
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recalculate Counters */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-3xl">Fix Project Issue Counters</CardTitle>
          <CardDescription>
            Recalculate issue counters for all projects based on actual issue counts. Use this if counters are out of sync after deleting issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecalculateCountersButton />
        </CardContent>
      </Card>

      {/* Database Cleanup */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-3xl">Database Cleanup</CardTitle>
          <CardDescription>
            Delete all issues and reset project counters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CleanupButton />
        </CardContent>
      </Card>
    </div>
  )
}
