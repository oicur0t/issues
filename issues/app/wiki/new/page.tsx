import { getCurrentSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { WikiForm } from '../components/WikiForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewWikiPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/wiki"
          className="btn-ghost btn-sm flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Wiki
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Wiki Page</CardTitle>
          <CardDescription>
            Create a new documentation page using Markdown. Your content will be automatically formatted and rendered.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WikiForm />
        </CardContent>
      </Card>
    </div>
  )
}