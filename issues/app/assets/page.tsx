import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { AssetList } from './components/AssetList'

export const dynamic = 'force-dynamic'

export default async function AssetsPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <AssetList />
    </div>
  )
}
