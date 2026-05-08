'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <div className="text-center px-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-8">{error.message || 'An unexpected error occurred'}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/'} size="lg">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

