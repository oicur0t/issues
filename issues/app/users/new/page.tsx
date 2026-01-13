import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { UserForm } from '../components/UserForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewUserPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/users')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/users"
          className="btn-ghost btn-sm flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>
            Add a new user to the system. You can set their role and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm />
        </CardContent>
      </Card>
    </div>
  )
}
