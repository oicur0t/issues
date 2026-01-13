'use client'

import { useState, useEffect } from 'react'
import { WikiPageWithAuthor, WikiFilter } from '@/lib/types'
import { getWikiPages, getWikiTags } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate, getUserInitials, generateAvatarColor } from '@/lib/utils'
import { Search, Filter, Plus, X, BookOpen, Calendar, User, Eye, Edit } from 'lucide-react'
import Link from 'next/link'

interface WikiListProps {
  onCreateNew?: () => void
}

export function WikiList({ onCreateNew }: WikiListProps) {
  const [wikiPages, setWikiPages] = useState<WikiPageWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  
  const [filter, setFilter] = useState<WikiFilter>({
    search: '',
    tags: [],
    isPublished: true,
  })
  
  const [showFilters, setShowFilters] = useState(false)

  const loadWikiPages = async () => {
    try {
      setLoading(true)
      setError(null)
      const [pagesData, tagsData] = await Promise.all([
        getWikiPages(filter),
        getWikiTags(),
      ])
      setWikiPages(pagesData)
      setAvailableTags(tagsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wiki pages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWikiPages()
  }, [filter])

  const handleFilterChange = (key: keyof WikiFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }

  const toggleTagFilter = (tag: string) => {
    setFilter(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }))
  }

  const clearFilters = () => {
    setFilter({
      search: '',
      tags: [],
      isPublished: true,
    })
  }

  const hasActiveFilters = filter.search || 
    (filter.tags && filter.tags.length > 0) ||
    filter.isPublished === false

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner h-8 w-8"></div>
        <span className="ml-2 text-muted-foreground">Loading wiki pages...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={loadWikiPages} className="btn-primary">
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
            <BookOpen className="h-12 w-12" />
            Wiki
          </h1>
          <p className="text-lg font-bold text-foreground/80 mt-2">
            {wikiPages.length} page{wikiPages.length !== 1 ? 's' : ''} found. Document your knowledge base.
          </p>
        </div>

        <Link href="/wiki/new" className="ml-6">
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Page
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
              placeholder="Search wiki pages..."
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
                {(filter.tags?.length || 0) + (filter.isPublished === false ? 1 : 0)}
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
            {/* Published Status */}
            <div>
              <h4 className="font-medium mb-2">Status</h4>
              <div className="flex gap-2">
                <Button
                  variant={filter.isPublished === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('isPublished', true)}
                  className="btn-sm"
                >
                  Published
                </Button>
                <Button
                  variant={filter.isPublished === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('isPublished', false)}
                  className="btn-sm"
                >
                  Drafts
                </Button>
                <Button
                  variant={filter.isPublished === undefined ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterChange('isPublished', undefined)}
                  className="btn-sm"
                >
                  All
                </Button>
              </div>
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={filter.tags?.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTagFilter(tag)}
                      className="btn-sm"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wiki Pages List */}
      {wikiPages.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? 'No wiki pages match your filters.'
              : 'No wiki pages have been created yet.'
            }
          </div>
          {!hasActiveFilters && (
            <Link href="/wiki/new">
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Page
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {wikiPages.map((page) => (
            <div key={page._id?.toString()} className="card hover:shadow-md transition-shadow">
              <div className="card-header">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Link 
                        href={`/wiki/${page.slug}`}
                        className="text-lg font-medium text-primary hover:underline truncate"
                      >
                        {page.title}
                      </Link>
                      {!page.isPublished && (
                        <Badge variant="secondary" className="badge-secondary">
                          Draft
                        </Badge>
                      )}
                    </div>
                    
                    {page.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {page.summary}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <div className="flex items-center gap-2">
                          <div 
                            className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-medium ${generateAvatarColor(page.author.email)}`}
                          >
                            {getUserInitials(page.author.name)}
                          </div>
                          <span>{page.author.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(page.updatedAt)}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        Version {page.version}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/wiki/${page.slug}`}>
                      <Button variant="ghost" size="sm" className="btn-ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/wiki/${page.slug}/edit`}>
                      <Button variant="ghost" size="sm" className="btn-ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Tags */}
              {page.tags.length > 0 && (
                <div className="card-content pt-0">
                  <div className="flex flex-wrap gap-1">
                    {page.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="badge badge-secondary text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}