'use client'

import { useState, useTransition } from 'react'
import { updateWikiPage } from '../actions'
import { Pencil, Check, X } from 'lucide-react'

interface InlineWikiSummaryEditProps {
  slug: string
  currentSummary: string
  onUpdate?: () => void
}

export function InlineWikiSummaryEdit({ slug, currentSummary, onUpdate }: InlineWikiSummaryEditProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [summary, setSummary] = useState(currentSummary)
  const [isPending, startTransition] = useTransition()

  const handleSave = async () => {
    startTransition(async () => {
      try {
        await updateWikiPage(slug, { summary: summary.trim() })
        setIsEditing(false)
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update summary:', error)
        alert('Failed to update summary')
        setSummary(currentSummary)
      }
    })
  }

  const handleCancel = () => {
    setSummary(currentSummary)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[80px] border-4 border-black px-4 py-2 text-sm focus:outline-none resize-none"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          placeholder="Enter a brief summary..."
          autoFocus
          disabled={isPending}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 bg-accent text-black border-4 border-black font-black text-sm hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Check className="h-4 w-4 inline mr-1" />
            Save
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 bg-muted text-black border-4 border-black font-black text-sm hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <X className="h-4 w-4 inline mr-1" />
            Cancel
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Press Ctrl+Enter to save, Esc to cancel</p>
      </div>
    )
  }

  return (
    <div className="group relative">
      <p className="text-sm text-muted-foreground">
        {currentSummary || <span className="italic">No summary provided</span>}
      </p>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -top-1 -right-10 opacity-0 group-hover:opacity-100 p-2 bg-primary text-white border-3 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
        style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}
