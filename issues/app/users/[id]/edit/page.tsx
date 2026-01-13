import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { getUser } from '../../actions'
import { UserForm } from '../../components/UserForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/users')
  }

  const { id } = await params
  const user = await getUser(id)

  if (!user) {
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
          <CardTitle>Edit User</CardTitle>
          <CardDescription>
            Update user information and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm
            user={{
              _id: user._id?.toString() || '',
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: user.avatar,
              isActive: user.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
