'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { recalculateProjectIssueCounters } from '@/app/projects/actions'
import { RefreshCw } from 'lucide-react'

export function RecalculateCountersButton() {
  const [isRecalculating, setIsRecalculating] = useState(false)
  const [result, setResult] = useState<{
    updated: number
    results: Array<{ projectId: string; projectKey: string; oldCount: number; newCount: number }>
  } | null>(null)

  const handleRecalculate = async () => {
    if (!confirm('Recalculate issue counters for all projects? This will update counters to match actual issue counts.')) {
      return
    }

    setIsRecalculating(true)
    setResult(null)

    try {
      const data = await recalculateProjectIssueCounters()
      setResult(data)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to recalculate counters')
    } finally {
      setIsRecalculating(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleRecalculate}
        disabled={isRecalculating}
        className="bg-blue-500 hover:bg-blue-600 text-white font-black border-3 border-black"
        style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
      >
        {isRecalculating ? (
          <>
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            Recalculating...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-5 w-5" />
            Recalculate Issue Counters
          </>
        )}
      </Button>

      {result && (
        <div className="border-3 border-black p-4 bg-green-50 space-y-3">
          <p className="font-black text-lg">
            ✓ Recalculation Complete
          </p>
          <p className="font-bold">
            Updated {result.updated} project{result.updated !== 1 ? 's' : ''}
          </p>

          {result.results.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="font-black">Results:</p>
              <div className="space-y-1">
                {result.results.map((r) => (
                  <div
                    key={r.projectId}
                    className={`p-2 border-2 border-black text-sm font-mono ${
                      r.oldCount !== r.newCount ? 'bg-yellow-100' : 'bg-white'
                    }`}
                  >
                    <span className="font-black">{r.projectKey}:</span>{' '}
                    {r.oldCount !== r.newCount ? (
                      <>
                        <span className="line-through text-red-600">{r.oldCount}</span>
                        {' → '}
                        <span className="text-green-600 font-bold">{r.newCount}</span>
                      </>
                    ) : (
                      <span className="text-gray-600">{r.newCount} (no change)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
