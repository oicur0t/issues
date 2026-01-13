'use client'

import { useState, useTransition } from 'react'
import { updateIssue } from '../actions'
import { Pencil, Check, X } from 'lucide-react'

interface InlineTitleEditProps {
  issueId: string
  currentTitle: string
  onUpdate?: () => void
}

export function InlineTitleEdit({ issueId, currentTitle, onUpdate }: InlineTitleEditProps) {
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
        await updateIssue(issueId, { title: title.trim() })
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

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 h-12 border-4 border-black bg-white px-4 py-2 text-xl font-black focus:outline-none"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          autoFocus
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="h-12 w-12 bg-accent text-black border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          <Check className="h-5 w-5 mx-auto" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="h-12 w-12 bg-destructive text-white border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          <X className="h-5 w-5 mx-auto" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 group">
      <h1 className="text-3xl font-black">{currentTitle}</h1>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-muted rounded transition-all"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
