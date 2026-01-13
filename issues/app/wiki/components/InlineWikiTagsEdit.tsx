'use client'

import { useState, useTransition } from 'react'
import { updateWikiPage } from '../actions'
import { X, Plus, Tag } from 'lucide-react'

interface InlineWikiTagsEditProps {
  slug: string
  currentTags: string[]
  onUpdate?: () => void
}

export function InlineWikiTagsEdit({ slug, currentTags, onUpdate }: InlineWikiTagsEditProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [tags, setTags] = useState<string[]>(currentTags)
  const [newTag, setNewTag] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const updatedTags = [...tags, trimmedTag]
      setTags(updatedTags)
      setNewTag('')

      startTransition(async () => {
        try {
          await updateWikiPage(slug, { tags: updatedTags })
          onUpdate?.()
        } catch (error) {
          console.error('Failed to add tag:', error)
          setTags(currentTags)
          alert('Failed to add tag')
        }
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    setTags(updatedTags)

    startTransition(async () => {
      try {
        await updateWikiPage(slug, { tags: updatedTags })
        onUpdate?.()
      } catch (error) {
        console.error('Failed to remove tag:', error)
        setTags(currentTags)
        alert('Failed to remove tag')
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setNewTag('')
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-black border-3 border-black font-bold text-sm"
              style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                disabled={isPending}
                className="hover:scale-110 transition-transform disabled:opacity-50"
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
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setIsEditing(false), 200)}
            className="flex-1 h-10 border-4 border-black px-3 text-sm focus:outline-none"
            style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
            placeholder="Add a tag..."
            autoFocus
            disabled={isPending}
          />
          <button
            onClick={handleAddTag}
            disabled={isPending || !newTag.trim()}
            className="px-4 py-2 bg-accent text-black border-4 border-black font-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
            style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <span className="text-sm text-muted-foreground italic">No tags</span>
        ) : (
          tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-black border-3 border-black font-bold text-sm"
              style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              {tag}
            </span>
          ))
        )}
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="p-2 bg-primary text-white border-3 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
        style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
      >
        <Tag className="h-4 w-4" />
      </button>
    </div>
  )
}
