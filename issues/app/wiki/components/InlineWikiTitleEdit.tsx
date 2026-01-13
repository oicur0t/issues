'use client'

import { useState, useTransition } from 'react'
import { updateWikiPage } from '../actions'
import { Pencil, Check, X } from 'lucide-react'

interface InlineWikiTitleEditProps {
  slug: string
  currentTitle: string
  onUpdate?: () => void
}

export function InlineWikiTitleEdit({ slug, currentTitle, onUpdate }: InlineWikiTitleEditProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [title, setTitle] = useState(currentTitle)
  const [isPending, startTransition] = useTransition()

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title cannot be empty')
      return
    }

    startTransition(async () => {
      try {
        await updateWikiPage(slug, { title: title.trim() })
        setIsEditing(false)
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update title:', error)
        alert('Failed to update title')
        setTitle(currentTitle)
      }
    })
  }

  const handleCancel = () => {
    setTitle(currentTitle)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-12 border-4 border-black px-4 text-3xl font-black focus:outline-none"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          autoFocus
          disabled={isPending}
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="p-3 bg-accent text-black border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="p-3 bg-muted text-black border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="group relative inline-block">
      <h1 className="text-3xl font-black">{currentTitle}</h1>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute -top-2 -right-12 opacity-0 group-hover:opacity-100 p-2 bg-primary text-white border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
        style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
