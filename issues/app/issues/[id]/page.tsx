import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { getIssue, deleteIssue } from '@/app/issues/actions'
import { getComments } from './comments/actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { IssueViewClient } from './components/IssueViewClient'
import { IssueComments } from './components/IssueComments'

interface IssuePageProps {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function IssuePage({ params }: IssuePageProps) {
  const { id } = await params
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const issue = await getIssue(id)

  if (!issue) {
    notFound()
  }

  const comments = await getComments(id)
  const canEdit = session.user.role === 'admin' || session.user.role === 'developer'
  const canDelete = session.user.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/issues"
            className="btn-ghost btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Issues
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {canDelete && (
            <form action={async () => {
              'use server'
              await deleteIssue(id)
              redirect('/issues')
            }}>
              <Button variant="destructive" className="btn-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Issue Details */}
      <IssueViewClient issue={issue} />

      {/* Comments */}
      <IssueComments
        issueId={id}
        initialComments={comments as any}
        currentUserId={session.user.id}
      />
    </div>
  )
}