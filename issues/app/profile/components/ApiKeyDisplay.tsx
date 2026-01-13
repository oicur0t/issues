'use client'

import { useState, useTransition } from 'react'
import { regenerateMyApiKey } from '@/app/users/actions'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw, Eye, EyeOff, Check } from 'lucide-react'

interface ApiKeyDisplayProps {
  apiKey?: string
}

export function ApiKeyDisplay({ apiKey }: ApiKeyDisplayProps) {
  const [showFull, setShowFull] = useState(false)
  const [copied, setCopied] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleCopy = async () => {
    try {
      const keyToCopy = newKey || apiKey
      if (!keyToCopy) {
        alert('No API key to copy')
        return
      }
      await navigator.clipboard.writeText(keyToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy API key to clipboard')
    }
  }

  const handleRegenerate = async () => {
    const message = apiKey
      ? 'Are you sure you want to regenerate your API key? Your old key will stop working immediately.'
      : 'Generate your API key now?'

    if (!confirm(message)) {
      return
    }

    startTransition(async () => {
      try {
        const plainKey = await regenerateMyApiKey()
        setNewKey(plainKey)
        setShowFull(true)
        alert('API key generated successfully! Make sure to copy your new key now.')
      } catch (error) {
        console.error('Failed to regenerate API key:', error)
        alert(error instanceof Error ? error.message : 'Failed to generate API key')
      }
    })
  }

  // Handle users created before API key feature was added
  if (!apiKey && !newKey) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted border-4 border-black" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
          <p className="font-black text-sm mb-2">No API Key Found</p>
          <p className="text-sm mb-4">
            Your account was created before API keys were implemented. Generate your API key below.
          </p>
          <Button
            onClick={handleRegenerate}
            disabled={isPending}
            className="font-black border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Generate API Key
          </Button>
        </div>
      </div>
    )
  }

  // Obfuscate the API key (show first 12 and last 4 characters)
  // At this point we know apiKey or newKey exists due to the early return above
  const actualKey = (newKey || apiKey) as string
  const obfuscatedKey = `${actualKey.substring(0, 12)}...${actualKey.substring(actualKey.length - 4)}`
  const displayKey = showFull ? actualKey : obfuscatedKey

  return (
    <div className="space-y-4">
      {newKey && (
        <div className="p-4 bg-accent border-4 border-black" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
          <p className="font-black text-sm mb-2">⚠️ New API Key Generated!</p>
          <p className="text-sm font-bold">
            Make sure to copy your new API key now. You won't be able to see it again!
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={displayKey}
            readOnly
            className="w-full px-4 py-3 border-4 border-black bg-muted font-mono text-sm font-bold focus:outline-none"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          />
        </div>

        <Button
          onClick={() => setShowFull(!showFull)}
          variant="outline"
          className="border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          {showFull ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>

        <Button
          onClick={handleCopy}
          variant="outline"
          className="border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleRegenerate}
          disabled={isPending}
          variant="destructive"
          className="font-black border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          Regenerate API Key
        </Button>
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        <p className="font-bold">⚠️ Security Tips:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Never commit your API key to version control</li>
          <li>Store it securely in environment variables</li>
          <li>Regenerate immediately if compromised</li>
          <li>All API actions are attributed to your user account</li>
        </ul>
      </div>
    </div>
  )
}
