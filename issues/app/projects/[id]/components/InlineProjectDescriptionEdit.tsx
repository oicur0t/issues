'use client'

import { useState, useTransition } from 'react'
import { updateProject } from '../../actions'
import { Pencil, Check, X } from 'lucide-react'

interface InlineProjectDescriptionEditProps {
  projectId: string
  currentDescription: string
  onUpdate?: () => void
}

export function InlineProjectDescriptionEdit({
  projectId,
  currentDescription,
  onUpdate
}: InlineProjectDescriptionEditProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [description, setDescription] = useState(currentDescription)
  const [isPending, startTransition] = useTransition()

  const handleSave = async () => {
    startTransition(async () => {
      try {
        await updateProject(projectId, { description: description.trim() })
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[120px] border-4 border-black px-4 py-2 focus:outline-none resize-none"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          placeholder="Describe what this project is about..."
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
      <p className="text-muted-foreground">
        {currentDescription || <span className="italic">No description provided</span>}
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
