import { getCurrentSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FeatureForm } from '../components/FeatureForm'
import { getProjects } from '@/app/projects/actions'
import { getAssignableUsers } from '@/app/users/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewFeaturePage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const [projects, users] = await Promise.all([getProjects(), getAssignableUsers()])

  // Serialize for client component (convert ObjectId to string)
  const serializedProjects = projects
    .filter(p => p._id)
    .map(p => ({ _id: p._id!.toString(), name: p.name, key: p.key }))
  const serializedUsers = users
    .filter(u => u._id)
    .map(u => ({ _id: u._id!.toString(), name: u.name }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/features" className="btn-ghost btn-sm flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Features
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Feature</CardTitle>
          <CardDescription>
            Describe something we intend to build. Link issues to it afterwards to track delivery.
            Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureForm projects={serializedProjects} users={serializedUsers} />
        </CardContent>
      </Card>
    </div>
  )
}
