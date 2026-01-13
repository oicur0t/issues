'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { IssueWithAssignee, IssueFilter, IssueStatus, IssuePriority } from '@/lib/types'
import { getIssues, getIssueTags } from '../actions'
import { IssueCard } from './IssueCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Plus, X, FileText } from 'lucide-react'

interface IssueListProps {
  onCreateNew?: () => void
}

export function IssueList({ onCreateNew }: IssueListProps) {
  const [issues, setIssues] = useState<IssueWithAssignee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  
  const [filter, setFilter] = useState<IssueFilter>({
    search: '',
    status: [],
    priority: [],
    tags: [],
  })
  
  const [showFilters, setShowFilters] = useState(false)

  const statusOptions: { value: IssueStatus; label: string }[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'blocked', label: 'Blocked' },
    { value: 'fixed', label: 'Fixed' },
    { value: 'wont_fix', label: "Won't Fix" },
  ]

  const priorityOptions: { value: IssuePriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ]

  const loadIssues = async () => {
    try {
      setLoading(true)
      setError(null)
      const [issuesData, tagsData] = await Promise.all([
        getIssues(filter),
        getIssueTags(),
      ])
      setIssues(issuesData)
      setAvailableTags(tagsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load issues')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIssues()
  }, [filter])

  const handleFilterChange = (key: keyof IssueFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }

  const toggleStatusFilter = (status: IssueStatus) => {
    setFilter(prev => ({
      ...prev,
      status: prev.status?.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...(prev.status || []), status]
    }))
  }

  const togglePriorityFilter = (priority: IssuePriority) => {
    setFilter(prev => ({
      ...prev,
      priority: prev.priority?.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...(prev.priority || []), priority]
    }))
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
      status: [],
      priority: [],
      tags: [],
    })
  }

  const hasActiveFilters = filter.search || 
    (filter.status && filter.status.length > 0) ||
    (filter.priority && filter.priority.length > 0) ||
    (filter.tags && filter.tags.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner h-8 w-8"></div>
        <span className="ml-2 text-muted-foreground">Loading issues...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">{error}</div>
        <Button onClick={loadIssues} className="btn-primary">
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
            <FileText className="h-12 w-12" />
            Issues
          </h1>
          <p className="text-lg font-bold text-foreground/80 mt-2">
            {issues.length} issue{issues.length !== 1 ? 's' : ''} found. Track bugs, features, and tasks.
          </p>
        </div>

        <Link href="/issues/new" className="ml-6">
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Issue
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
              placeholder="Search issues..."
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
                {(filter.status?.length || 0) + 
                 (filter.priority?.length || 0) + 
                 (filter.tags?.length || 0)}
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
            {/* Status Filters */}
            <div>
              <h4 className="font-medium mb-2">Status</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filter.status?.includes(option.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleStatusFilter(option.value)}
                    className="btn-sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Priority Filters */}
            <div>
              <h4 className="font-medium mb-2">Priority</h4>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filter.priority?.includes(option.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => togglePriorityFilter(option.value)}
                    className="btn-sm"
                  >
                    {option.label}
                  </Button>
                ))}
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

      {/* Issues List */}
      {issues.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {hasActiveFilters 
              ? 'No issues match your filters.'
              : 'No issues have been created yet.'
            }
          </div>
          {!hasActiveFilters && (
            <Link href="/issues/new">
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Issue
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {issues.map((issue) => (
            <IssueCard key={issue._id!.toString()} issue={issue} />
          ))}
        </div>
      )}
    </div>
  )
}