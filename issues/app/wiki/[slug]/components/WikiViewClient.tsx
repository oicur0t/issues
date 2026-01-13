'use client'

import { useRouter } from 'next/navigation'
import { InlineWikiTitleEdit } from '../../components/InlineWikiTitleEdit'
import { InlineWikiSummaryEdit } from '../../components/InlineWikiSummaryEdit'
import { InlineMarkdownEditor } from '../../components/InlineMarkdownEditor'
import { InlineWikiTagsEdit } from '../../components/InlineWikiTagsEdit'
import { InlinePublishToggle } from '../../components/InlinePublishToggle'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

interface WikiViewClientProps {
  slug: string
  title: string
  summary: string | undefined
  content: string
  tags: string[]
  isPublished: boolean
  canEdit: boolean
}

export function WikiViewClient({
  slug,
  title,
  summary,
  content,
  tags,
  isPublished,
  canEdit
}: WikiViewClientProps) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <BookOpen className="h-6 w-6 flex-shrink-0" />
              {canEdit ? (
                <InlineWikiTitleEdit
                  slug={slug}
                  currentTitle={title}
                  onUpdate={handleUpdate}
                />
              ) : (
                <h1 className="text-3xl font-black">{title}</h1>
              )}
            </div>

            {canEdit && (
              <InlinePublishToggle
                slug={slug}
                currentPublished={isPublished}
                onUpdate={handleUpdate}
              />
            )}
          </div>

          {!isPublished && !canEdit && (
            <div className="flex items-center gap-2">
              <span className="badge badge-secondary">Draft</span>
              <span className="text-sm text-muted-foreground">
                This page is not yet published and only visible to editors.
              </span>
            </div>
          )}

          <div>
            {canEdit ? (
              <InlineWikiSummaryEdit
                slug={slug}
                currentSummary={summary || ''}
                onUpdate={handleUpdate}
              />
            ) : summary ? (
              <CardDescription className="text-base">{summary}</CardDescription>
            ) : null}
          </div>

          <div>
            {canEdit ? (
              <InlineWikiTagsEdit
                slug={slug}
                currentTags={tags}
                onUpdate={handleUpdate}
              />
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-black border-3 border-black font-bold text-sm"
                    style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {canEdit ? (
          <InlineMarkdownEditor
            slug={slug}
            currentContent={content}
            onUpdate={handleUpdate}
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            {content}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
