import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { getFeature, getFeatureIssues, deleteFeature } from '@/app/features/actions'
import { getAssignableUsers } from '@/app/users/actions'
import { getFeatureComments } from './comments/actions'
import { IssueComments } from '@/app/issues/[id]/components/IssueComments'
import { serializeForApi } from '@/lib/api-utils'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { FeatureViewClient } from './components/FeatureViewClient'

interface FeaturePageProps {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { id } = await params
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const feature = await getFeature(id)

  if (!feature) {
    notFound()
  }

  const [issues, users, comments] = await Promise.all([
    getFeatureIssues(id),
    getAssignableUsers(),
    getFeatureComments(id),
  ])

  const canEdit = session.user.role === 'admin' || session.user.role === 'developer'
  const featureId = feature._id!.toString()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/features" className="btn-ghost btn-sm flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Features
        </Link>

        {canEdit && (
          <form action={async () => {
            'use server'
            await deleteFeature(featureId)
            redirect('/features')
          }}>
            <Button variant="destructive" className="btn-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </form>
        )}
      </div>

      <FeatureViewClient
        feature={serializeForApi(feature)}
        issues={serializeForApi(issues)}
        users={users.filter(u => u._id).map(u => ({ _id: u._id!.toString(), name: u.name }))}
        canEdit={canEdit}
      />

      <IssueComments
        featureId={featureId}
        initialComments={serializeForApi(comments) as any}
        currentUserId={session.user.id}
      />
    </div>
  )
}
