'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IssueWithAssignee } from '@/lib/types'
import { useUser } from '@/app/components/UserProvider'
import { claimIssue, releaseIssue } from '../claim-actions'
import { Lock } from 'lucide-react'

interface ClaimControlProps {
  issue: IssueWithAssignee
}

/** Shows who is working on an issue and lets developers claim or release it */
export function ClaimControl({ issue }: Readonly<ClaimControlProps>) {
  const router = useRouter()
  const { session } = useUser()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const role = session?.user.role
  const canEdit = role === 'admin' || role === 'developer'
  const liveClaim = !!issue.claimer && !issue.claimExpired
  const heldByMe = liveClaim && issue.claimer!._id.toString() === session?.user.id
  const isClosed = issue.status === 'fixed' || issue.status === 'wont_fix'

  const run = (action: () => Promise<unknown>) => {
    setError(null)
    startTransition(async () => {
      try {
        await action()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        {issue.claimer && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black text-sm font-bold ${
              liveClaim ? 'bg-yellow-200' : 'bg-gray-200'
            }`}
            style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Lock className="h-3.5 w-3.5" />
            {liveClaim ? `Claimed by ${issue.claimer.name}` : `Claim by ${issue.claimer.name} expired`}
          </span>
        )}

        {canEdit && !isClosed && !heldByMe && (
          <button
            onClick={() => run(() => claimIssue(issue._id!.toString()))}
            disabled={isPending}
            className="px-3 py-1 bg-white border-2 border-black text-sm font-bold hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50"
            style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            {liveClaim ? 'Take over' : 'Claim'}
          </button>
        )}

        {canEdit && liveClaim && (heldByMe || role === 'admin') && (
          <button
            onClick={() => run(() => releaseIssue(issue._id!.toString()))}
            disabled={isPending}
            className="px-3 py-1 bg-white border-2 border-black text-sm font-bold hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50"
            style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            Release
          </button>
        )}
      </div>
      {error && <div className="text-sm text-destructive font-bold">{error}</div>}
    </div>
  )
}
