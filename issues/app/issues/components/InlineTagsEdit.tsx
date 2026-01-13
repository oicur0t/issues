'use client'

import { useState, useTransition } from 'react'
import { updateIssue } from '../actions'
import { Pencil, Check, X, Plus, Tag as TagIcon } from 'lucide-react'

interface InlineTagsEditProps {
  issueId: string
  currentTags: string[]
  onUpdate?: () => void
}

export function InlineTagsEdit({ issueId, currentTags, onUpdate }: InlineTagsEditProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [tags, setTags] = useState<string[]>(currentTags)
  const [newTag, setNewTag] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleSave = async () => {
    startTransition(async () => {
      try {
        await updateIssue(issueId, { tags })
        setIsEditing(false)
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update tags:', error)
        alert('Failed to update tags')
        setTags(currentTags)
      }
    })
  }

  const handleCancel = () => {
    setTags(currentTags)
    setNewTag('')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 text-xs font-black border-3 border-black bg-secondary text-black"
              style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            className="flex-1 h-10 border-4 border-black bg-white px-3 py-2 text-sm font-bold focus:outline-none"
            style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            disabled={isPending}
          />
          <button
            onClick={handleAddTag}
            disabled={isPending}
            className="h-10 px-4 bg-secondary text-black border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 transition-all"
            style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

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
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 text-xs font-black border-3 border-black bg-secondary text-black"
              style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground font-bold">No tags</div>
      )}
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-2 hover:bg-muted rounded transition-all"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
