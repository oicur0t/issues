'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-destructive/10 border-4 border-destructive" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black">Something went wrong!</CardTitle>
              <CardDescription>An error occurred while processing your request</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          <div className="p-4 bg-destructive/10 border-4 border-destructive" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
            <h3 className="font-bold text-lg mb-2 text-destructive">Error Message:</h3>
            <p className="font-mono text-sm text-destructive whitespace-pre-wrap break-words">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>

          {/* Error Digest */}
          {error.digest && (
            <div className="p-4 bg-muted border-4 border-black" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
              <h3 className="font-bold text-sm mb-1">Error Digest:</h3>
              <p className="font-mono text-xs text-muted-foreground">{error.digest}</p>
            </div>
          )}

          {/* Stack Trace (Development/Internal Tool) */}
          {error.stack && (
            <div className="p-4 bg-muted border-4 border-black overflow-auto max-h-96" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
              <h3 className="font-bold text-sm mb-2">Stack Trace:</h3>
              <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
            </div>
          )}

          {/* Error Details Object */}
          <div className="p-4 bg-muted border-4 border-black overflow-auto max-h-96" style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}>
            <h3 className="font-bold text-sm mb-2">Error Details:</h3>
            <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap break-words">
              {JSON.stringify(
                {
                  name: error.name,
                  message: error.message,
                  digest: error.digest,
                  cause: (error as any).cause,
                },
                null,
                2
              )}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={reset}
              className="btn-primary flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="btn-outline flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
