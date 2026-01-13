'use client'

import { useState, useTransition } from 'react'
import { updateWikiPage } from '../actions'
import { Pencil, Check, X, Eye, Code } from 'lucide-react'
import { WikiRenderer } from './WikiRenderer'

interface InlineMarkdownEditorProps {
  slug: string
  currentContent: string
  onUpdate?: () => void
}

export function InlineMarkdownEditor({ slug, currentContent, onUpdate }: InlineMarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [content, setContent] = useState(currentContent)
  const [showPreview, setShowPreview] = useState(true)
  const [isPending, startTransition] = useTransition()

  const handleSave = async () => {
    if (!content.trim()) {
      alert('Content cannot be empty')
      return
    }

    startTransition(async () => {
      try {
        await updateWikiPage(slug, { content: content.trim() })
        setIsEditing(false)
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update content:', error)
        alert('Failed to update content')
        setContent(currentContent)
      }
    })
  }

  const handleCancel = () => {
    setContent(currentContent)
    setIsEditing(false)
    setShowPreview(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-3">
        {/* Editor/Preview Toggle */}
        <div className="flex gap-2 border-b-4 border-black pb-2">
          <button
            onClick={() => setShowPreview(false)}
            className={`px-4 py-2 font-black text-sm transition-all ${
              !showPreview
                ? 'bg-primary text-white border-4 border-black'
                : 'bg-muted text-black border-2 border-black'
            }`}
            style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Code className="h-4 w-4 inline mr-2" />
            Markdown
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-4 py-2 font-black text-sm transition-all ${
              showPreview
                ? 'bg-primary text-white border-4 border-black'
                : 'bg-muted text-black border-2 border-black'
            }`}
            style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Preview
          </button>
        </div>

        {/* Editor or Preview */}
        {showPreview ? (
          <div
            className="min-h-[400px] p-6 border-4 border-black bg-white"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <WikiRenderer content={content} />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full min-h-[400px] border-4 border-black bg-white px-4 py-3 text-sm font-mono focus:outline-none"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
            placeholder="Write markdown content here..."
            autoFocus
            disabled={isPending}
          />
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-3 bg-accent text-black border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Check className="h-4 w-4 inline mr-2" />
            Save Changes
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-6 py-3 bg-muted text-black border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <X className="h-4 w-4 inline mr-2" />
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      <WikiRenderer content={currentContent} />
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-3 bg-primary text-white border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all font-black"
        style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
      >
        <Pencil className="h-5 w-5" />
      </button>
    </div>
  )
}
