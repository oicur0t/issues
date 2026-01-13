import { getCurrentSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AssetForm } from '../components/AssetForm'
import { getProjects } from '@/app/projects/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewAssetPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const projects = await getProjects()

  // Serialize projects for client component (convert ObjectId to string)
  const serializedProjects = projects
    .filter(p => p._id)
    .map(p => ({
      _id: p._id!.toString(),
      name: p.name,
      key: p.key
    }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/assets"
          className="btn-ghost btn-sm flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assets
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Asset</CardTitle>
          <CardDescription>
            Fill in the details below to add a new infrastructure asset. Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssetForm projects={serializedProjects} />
        </CardContent>
      </Card>
    </div>
  )
}
