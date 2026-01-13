'use client'

import { useState } from 'react'
import { CreateWikiData, UpdateWikiData } from '@/lib/types'
import { createWikiPage, updateWikiPage } from '../actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface WikiFormProps {
  wikiPage?: {
    _id: string
    title: string
    content: string
    summary?: string
    tags: string[]
    isPublished: boolean
  }
  onSuccess?: () => void
  onCancel?: () => void
}

export function WikiForm({ wikiPage, onSuccess, onCancel }: WikiFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: wikiPage?.title || '',
    content: wikiPage?.content || '',
    summary: wikiPage?.summary || '',
    tags: wikiPage?.tags?.join(', ') || '',
    isPublished: wikiPage?.isPublished ?? true,
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        summary: formData.summary.trim() || undefined,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        isPublished: formData.isPublished,
      }

      if (wikiPage) {
        // Update existing wiki page
        await updateWikiPage(wikiPage._id, submitData as UpdateWikiData)
      } else {
        // Create new wiki page
        await createWikiPage(submitData as CreateWikiData)
      }

      onSuccess?.()
      router.push('/wiki')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="form-group">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter wiki page title"
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          The title will be automatically converted to a URL-friendly slug
        </p>
      </div>

      <div className="form-group">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => handleInputChange('summary', e.target.value)}
          placeholder="Brief description of this wiki page (optional)"
          rows={2}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          A short summary that will appear in search results and page listings
        </p>
      </div>

      <div className="form-group">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="Write your wiki content in Markdown format"
          rows={12}
          required
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          You can use Markdown syntax for formatting. Supports headings, lists, code blocks, tables, and more.
        </p>
      </div>

      <div className="form-group">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          type="text"
          value={formData.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          placeholder="Enter tags separated by commas (e.g., documentation, guide, tutorial)"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate multiple tags with commas to help categorize your content
        </p>
      </div>

      <div className="form-group">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={formData.isPublished}
            onChange={(e) => handleInputChange('isPublished', e.target.checked)}
            disabled={isSubmitting}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isPublished" className="text-sm font-medium">
            Publish immediately
          </Label>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          Uncheck to save as a draft (only visible to editors and admins)
        </p>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Saving...' : wikiPage ? 'Update Wiki Page' : 'Create Wiki Page'}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-outline"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Markdown Quick Reference */}
      <div className="border rounded-lg p-4 bg-muted/20">
        <h4 className="font-medium mb-2">Markdown Quick Reference</h4>
        <div className="text-sm text-muted-foreground space-y-1">
          <div><code># Heading 1</code> - Large heading</div>
          <div><code>## Heading 2</code> - Medium heading</div>
          <div><code>### Heading 3</code> - Small heading</div>
          <div><code>*italic*</code> or <code>_italic_</code> - Italic text</div>
          <div><code>**bold**</code> or <code>__bold__</code> - Bold text</div>
          <div><code>- List item</code> - Bullet list</div>
          <div><code>1. Numbered item</code> - Numbered list</div>
          <div><code>[link text](url)</code> - Link</div>
          <div><code>`code`</code> - Inline code</div>
          <div><code>```language</code> - Code block</div>
          <div><code>{'> Quote'}</code> - Blockquote</div>
        </div>
      </div>
    </form>
  )
}