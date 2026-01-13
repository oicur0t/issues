import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { getWikiPage, deleteWikiPage } from '@/app/wiki/actions'
import { WikiViewClient } from './components/WikiViewClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, getUserInitials, generateAvatarColor } from '@/lib/utils'
import {
  ArrowLeft,
  Trash2,
  Calendar,
  User,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface WikiPageProps {
  params: Promise<{
    slug: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function WikiPageView({ params }: WikiPageProps) {
  const { slug } = await params
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const wikiPage = await getWikiPage(slug)

  if (!wikiPage) {
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
            href="/wiki"
            className="btn-ghost btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Wiki
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {canDelete && (
            <form action={async () => {
              'use server'
              await deleteWikiPage(slug)
              redirect('/wiki')
            }}>
              <Button variant="destructive" className="btn-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Wiki Page Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <WikiViewClient
            slug={slug}
            title={wikiPage.title}
            summary={wikiPage.summary}
            content={wikiPage.content}
            tags={wikiPage.tags}
            isPublished={wikiPage.isPublished}
            canEdit={canEdit}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Page Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Page Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Author */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Author
                </h4>
                <div className="flex items-center gap-3">
                  <div 
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${generateAvatarColor(wikiPage.author.email)}`}
                  >
                    {getUserInitials(wikiPage.author.name)}
                  </div>
                  <div>
                    <div className="font-medium">{wikiPage.author.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {wikiPage.author.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Editor */}
              {wikiPage.lastEditor && (
                <div>
                  <h4 className="font-medium mb-2">Last Edited By</h4>
                  <div className="flex items-center gap-3">
                    <div 
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${generateAvatarColor(wikiPage.lastEditor.email)}`}
                    >
                      {getUserInitials(wikiPage.lastEditor.name)}
                    </div>
                    <div>
                      <div className="font-medium">{wikiPage.lastEditor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {wikiPage.lastEditor.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dates
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium">Created</div>
                    <div className="text-muted-foreground">
                      {formatDate(wikiPage.createdAt)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium">Updated</div>
                    <div className="text-muted-foreground">
                      {formatDate(wikiPage.updatedAt)}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium">Version</div>
                    <div className="text-muted-foreground">
                      {wikiPage.version}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}