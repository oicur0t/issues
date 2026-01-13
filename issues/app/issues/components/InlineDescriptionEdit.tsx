'use client'

import { useState, useTransition } from 'react'
import { updateIssue } from '../actions'
import { Pencil, Check, X } from 'lucide-react'

interface InlineDescriptionEditProps {
  issueId: string
  currentDescription: string
  onUpdate?: () => void
}

export function InlineDescriptionEdit({ issueId, currentDescription, onUpdate }: InlineDescriptionEditProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [description, setDescription] = useState(currentDescription)
  const [isPending, startTransition] = useTransition()

  const handleSave = async () => {
    if (!description.trim()) {
      alert('Description cannot be empty')
      return
    }

    startTransition(async () => {
      try {
        await updateIssue(issueId, { description: description.trim() })
        setIsEditing(false)
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update description:', error)
        alert('Failed to update description')
        setDescription(currentDescription)
      }
    })
  }

  const handleCancel = () => {
    setDescription(currentDescription)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full min-h-[200px] border-4 border-black bg-white px-4 py-3 text-sm font-bold focus:outline-none"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          autoFocus
          disabled={isPending}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2 bg-accent text-black border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Check className="h-4 w-4 inline mr-2" />
            Save
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-5 py-2 bg-muted text-black border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
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
      <div className="prose prose-gray max-w-none whitespace-pre-wrap">
        {currentDescription}
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-2 hover:bg-muted rounded transition-all"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
