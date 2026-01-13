'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CleanupButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to delete ALL issues and reset project counters? This cannot be undone!')) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cleanup database')
      }

      setResult(`Successfully deleted ${data.deletedIssues} issues and reset ${data.resetProjects} project counters`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="p-4 bg-destructive/10 border-4 border-destructive text-destructive font-bold"
        style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
      >
        <p className="font-black text-lg mb-2">⚠️ WARNING</p>
        <p>This will permanently delete ALL issues from the database and reset all project issue counters to 0.</p>
        <p className="mt-2">This action cannot be undone!</p>
      </div>

      {result && (
        <div
          className="p-4 bg-green-100 border-4 border-green-500 text-green-900 font-bold"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          {result}
        </div>
      )}

      {error && (
        <div
          className="p-4 bg-destructive/10 border-4 border-destructive text-destructive font-bold"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          {error}
        </div>
      )}

      <Button
        onClick={handleCleanup}
        disabled={loading}
        variant="destructive"
        className="btn-destructive"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Deleting...' : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All Issues
          </>
        )}
      </Button>
    </div>
  )
}
