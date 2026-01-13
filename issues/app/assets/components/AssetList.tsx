'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AssetWithProjects, AssetFilter } from '@/lib/types'
import { getAssets } from '../actions'
import { AssetCard } from './AssetCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Plus, X, Server } from 'lucide-react'

export function AssetList() {
  const [assets, setAssets] = useState<AssetWithProjects[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<AssetFilter>({
    search: '',
    type: [],
    tags: [],
  })

  const [showFilters, setShowFilters] = useState(false)

  const loadAssets = async () => {
    try {
      setLoading(true)
      setError(null)
      const assetsData = await getAssets(filter)
      setAssets(assetsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssets()
  }, [filter])

  const handleFilterChange = (key: keyof AssetFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }

  const toggleTypeFilter = (type: string) => {
    setFilter(prev => ({
      ...prev,
      type: prev.type?.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...(prev.type || []), type]
    }))
  }

  const clearFilters = () => {
    setFilter({
      search: '',
      type: [],
      tags: [],
    })
  }

  const hasActiveFilters = filter.search ||
    (filter.type && filter.type.length > 0) ||
    (filter.tags && filter.tags.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner h-8 w-8"></div>
        <span className="ml-2 text-muted-foreground">Loading assets...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={loadAssets} className="btn-primary">
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
            <Server className="h-12 w-12" />
            Assets
          </h1>
          <p className="text-lg font-bold text-foreground/80 mt-2">
            {assets.length} asset{assets.length !== 1 ? 's' : ''} tracked. Monitor your infrastructure.
          </p>
        </div>

        <Link href="/assets/new" className="ml-6">
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Asset
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets by name, hostname, IP, or description..."
              value={filter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {(filter.type?.length || 0) + (filter.tags?.length || 0)}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="btn-ghost">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Additional filters coming soon. Use the search bar to filter assets.
            </p>
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {assets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'No assets match your filters.'
              : 'No assets have been added yet.'
            }
          </div>
          {!hasActiveFilters && (
            <Link href="/assets/new">
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Asset
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard key={asset._id!.toString()} asset={asset} />
          ))}
        </div>
      )}
    </div>
  )
}
