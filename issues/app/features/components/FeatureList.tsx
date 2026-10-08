'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FeatureWithDetails, FeatureFilter, FeatureStatus } from '@/lib/types'
import { getFeatures } from '../actions'
import { FeatureCard } from './FeatureCard'
import { featureStatuses, featureStatusConfig } from './FeatureBadges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, X, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FeatureList() {
  const [features, setFeatures] = useState<FeatureWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FeatureFilter>({ search: '', status: [] })

  const loadFeatures = async () => {
    try {
      setLoading(true)
      setError(null)
      setFeatures(await getFeatures(filter))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load features')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeatures()
  }, [filter])

  const toggleStatus = (status: FeatureStatus) => {
    setFilter(prev => ({
      ...prev,
      status: prev.status?.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status],
    }))
  }

  const hasActiveFilters = !!filter.search || (filter.status && filter.status.length > 0)

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={loadFeatures} className="btn-primary">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="border-4 border-black p-6 bg-secondary flex-1" style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}>
          <h1 className="text-5xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            <Sparkles className="h-12 w-12" />
            Features
          </h1>
          <p className="text-lg font-bold text-foreground/80 mt-2">
            {features.length} feature{features.length !== 1 ? 's' : ''}. Track what we are building.
          </p>
        </div>

        <Link href="/features/new" className="ml-6">
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Feature
          </Button>
        </Link>
      </div>

      {/* Search and status filters */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search features by title, description, or number..."
              value={filter.search || ''}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={() => setFilter({ search: '', status: [] })} className="btn-ghost">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {featureStatuses.map(status => {
            const active = filter.status?.includes(status)
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={cn(
                  'px-3 py-1.5 border-2 border-black font-black text-sm transition-all',
                  active ? featureStatusConfig[status].color : 'bg-white hover:bg-muted'
                )}
                style={{ boxShadow: active ? 'none' : '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
              >
                {featureStatusConfig[status].label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner h-8 w-8"></div>
          <span className="ml-2 text-muted-foreground">Loading features...</span>
        </div>
      ) : features.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {hasActiveFilters ? 'No features match your filters.' : 'No features have been added yet.'}
          </div>
          {!hasActiveFilters && (
            <Link href="/features/new">
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Feature
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature._id!.toString()} feature={feature} />
          ))}
        </div>
      )}
    </div>
  )
}
