'use client'

import { useState, useTransition } from 'react'
import { regenerateApiKey } from '../actions'

interface ApiKeyCellProps {
  apiKey?: string
  userName: string
  userId: string
}

export function ApiKeyCell({ apiKey, userName, userId }: ApiKeyCellProps) {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [plainKey, setPlainKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Only show the plain key if it was just regenerated
  // We can't show the hashed key from the database - it's not the actual API key
  if (!apiKey && !plainKey) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No API key
      </div>
    )
  }

  // If we have a hashed key but no plain key, show message to regenerate
  if (!plainKey) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground italic">
          Key exists (click Regenerate to view)
        </span>
        <button
          onClick={() => {
            const confirmed = confirm(`Regenerate API key for ${userName}?\n\nThis will invalidate their current API key immediately.`)
            if (!confirmed) return

            startTransition(async () => {
              try {
                const newPlainKey = await regenerateApiKey(userId)
                setPlainKey(newPlainKey)
                setShowKey(true)
                alert(`New API key generated for ${userName}!\n\nMake sure to copy it now - it won't be shown again.`)
              } catch (error) {
                console.error('Failed to regenerate API key:', error)
                alert(error instanceof Error ? error.message : 'Failed to regenerate API key')
              }
            })
          }}
          disabled={isPending}
          className="px-2 py-1 text-xs font-bold border-2 border-black bg-yellow-300 hover:bg-yellow-400 transition-colors disabled:opacity-50"
          style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
          title="Regenerate API key"
        >
          {isPending ? 'Generating...' : 'Regenerate'}
        </button>
      </div>
    )
  }

  // If we get here, we have a plain key to display
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy API key to clipboard')
    }
  }

  const handleRegenerate = () => {
    const confirmed = confirm(`Regenerate API key for ${userName}?\n\nThis will invalidate their current API key immediately.`)
    if (!confirmed) return

    startTransition(async () => {
      try {
        const newPlainKey = await regenerateApiKey(userId)
        setPlainKey(newPlainKey)
        setShowKey(true)
        setCopied(false) // Reset copied state
        alert(`New API key generated for ${userName}!\n\nMake sure to copy it now - it won't be shown again.`)
      } catch (error) {
        console.error('Failed to regenerate API key:', error)
        alert(error instanceof Error ? error.message : 'Failed to regenerate API key')
      }
    })
  }

  const maskedKey = `${plainKey.substring(0, 8)}...${plainKey.substring(plainKey.length - 4)}`

  return (
    <div className="flex items-center gap-2">
      <code className="text-xs font-mono bg-muted px-2 py-1 rounded border border-border">
        {showKey ? plainKey : maskedKey}
      </code>
      <button
        onClick={() => setShowKey(!showKey)}
        className="px-2 py-1 text-xs font-bold border-2 border-black bg-white hover:bg-gray-100 transition-colors"
        style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
        title={showKey ? "Hide API key" : "Show API key"}
      >
        {showKey ? 'Hide' : 'Show'}
      </button>
      <button
        onClick={handleCopy}
        className="px-2 py-1 text-xs font-bold border-2 border-black bg-white hover:bg-gray-100 transition-colors"
        style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
        title="Copy API key"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={handleRegenerate}
        disabled={isPending}
        className="px-2 py-1 text-xs font-bold border-2 border-black bg-yellow-300 hover:bg-yellow-400 transition-colors disabled:opacity-50"
        style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
        title="Regenerate API key"
      >
        {isPending ? 'Generating...' : 'Regenerate'}
      </button>
    </div>
  )
}
