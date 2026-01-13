import { getCurrentSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { IssueForm } from '../components/IssueForm'
import { getProjects } from '@/app/projects/actions'
import { getAssignableUsers } from '@/app/users/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface NewIssuePageProps {
  searchParams: Promise<{
    project?: string
  }>
}

export default async function NewIssuePage({ searchParams }: NewIssuePageProps) {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const params = await searchParams
  const [projects, users] = await Promise.all([
    getProjects(),
    getAssignableUsers()
  ])

  // Serialize projects for client component (convert ObjectId to string)
  const serializedProjects = projects
    .filter(p => p._id) // Only include projects with valid IDs
    .map(p => ({
      _id: p._id!.toString(),
      name: p.name,
      key: p.key
    }))

  // Serialize users for client component
  const serializedUsers = users
    .filter(u => u._id) // Only include users with valid IDs
    .map(u => ({
      _id: u._id!.toString(),
      name: u.name,
      email: u.email
    }))

  // Validate that the default project exists
  const defaultProjectId = params.project && serializedProjects.some(p => p._id === params.project)
    ? params.project
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/issues"
          className="btn-ghost btn-sm flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Issues
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Issue</CardTitle>
          <CardDescription>
            Fill in the details below to create a new issue. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IssueForm projects={serializedProjects} users={serializedUsers} defaultProjectId={defaultProjectId} />
        </CardContent>
      </Card>
    </div>
  )
}