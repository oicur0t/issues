'use client'

import { useState } from 'react'
import { cleanupOrphanedIssues } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CleanupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCleanup = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await cleanupOrphanedIssues()
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Cleanup Orphaned Issues</CardTitle>
          <CardDescription>
            Remove issues that reference deleted projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCleanup}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Cleaning up...' : 'Run Cleanup'}
          </Button>

          {error && (
            <div className="p-4 border-4 border-red-500 bg-red-50">
              <p className="text-red-700 font-bold">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 border-4 border-green-500 bg-green-50">
              <p className="text-green-700 font-bold">Success!</p>
              <p className="text-green-600">Deleted {result.deletedCount} orphaned issues</p>
              {result.orphanedIds.length > 0 && (
                <div className="mt-2">
                  <p className="font-bold">Deleted IDs:</p>
                  <ul className="list-disc list-inside">
                    {result.orphanedIds.map((id: string) => (
                      <li key={id} className="text-sm font-mono">{id}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
