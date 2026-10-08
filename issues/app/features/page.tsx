import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { FeatureList } from './components/FeatureList'

export const dynamic = 'force-dynamic'

export default async function FeaturesPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <FeatureList />
    </div>
  )
}
