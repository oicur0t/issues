import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { getAsset, deleteAsset } from '@/app/assets/actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { AssetViewClient } from './components/AssetViewClient'

interface AssetPageProps {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function AssetPage({ params }: AssetPageProps) {
  const { id } = await params
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const asset = await getAsset(id)

  if (!asset) {
    notFound()
  }

  const canEdit = session.user.role === 'admin' || session.user.role === 'developer'
  const canDelete = session.user.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/assets"
            className="btn-ghost btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assets
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {canDelete && (
            <form action={async () => {
              'use server'
              await deleteAsset(id)
              redirect('/assets')
            }}>
              <Button variant="destructive" className="btn-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Asset Details */}
      <AssetViewClient asset={asset} />
    </div>
  )
}
