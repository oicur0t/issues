import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { WikiList } from './components/WikiList'

export const dynamic = 'force-dynamic'

export default async function WikiPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <WikiList />
    </div>
  )
}