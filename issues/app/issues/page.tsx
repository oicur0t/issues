import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { IssueList } from './components/IssueList'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function IssuesPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <IssueList />
    </div>
  )
}