'use client'

import { useState, useTransition } from 'react'
import { updateWikiPage } from '../actions'
import { Eye, EyeOff } from 'lucide-react'

interface InlinePublishToggleProps {
  slug: string
  currentPublished: boolean
  onUpdate?: () => void
}

export function InlinePublishToggle({ slug, currentPublished, onUpdate }: InlinePublishToggleProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticPublished, setOptimisticPublished] = useState(currentPublished)

  const handleToggle = async () => {
    const newValue = !optimisticPublished
    setOptimisticPublished(newValue)

    startTransition(async () => {
      try {
        await updateWikiPage(slug, { isPublished: newValue })
        onUpdate?.()
      } catch (error) {
        console.error('Failed to toggle publish status:', error)
        setOptimisticPublished(currentPublished)
        alert('Failed to update publish status')
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-4 py-2 border-4 border-black font-black text-sm transition-all hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 ${
        optimisticPublished
          ? 'bg-accent text-black'
          : 'bg-muted text-black'
      }`}
      style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
    >
      {optimisticPublished ? (
        <>
          <Eye className="h-4 w-4" />
          Published
        </>
      ) : (
        <>
          <EyeOff className="h-4 w-4" />
          Draft
        </>
      )}
    </button>
  )
}
