'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FeatureStatus, FeaturePriority } from '@/lib/types'
import { updateFeature, linkIssueToFeature, unlinkIssueFromFeature } from '../../actions'
import { FeatureForm } from '../../components/FeatureForm'
import { FeatureStatusBadge, FeatureProgressBar, featureStatuses, featureStatusConfig } from '../../components/FeatureBadges'
import { WikiRenderer } from '@/app/wiki/components/WikiRenderer'
import { IssueStatusBadge } from '@/app/issues/components/IssueStatusBadge'
import { IssuePriorityBadge } from '@/app/issues/components/IssuePriorityBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { Calendar, User, Tag, FolderKanban, BookOpen, Pencil, Plus, X } from 'lucide-react'

// Props arrive JSON-serialized from the server page (ObjectIds/Dates are strings)
interface FeatureViewClientProps {
  feature: any
  issues: any[]
  users: Array<{ _id: string; name: string }>
  canEdit: boolean
}

export function FeatureViewClient({ feature, issues, users, canEdit }: FeatureViewClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [issueToLink, setIssueToLink] = useState('')

  const run = (action: () => Promise<void>) => {
    setError(null)
    startTransition(async () => {
      try {
        await action()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  const handleStatusChange = (status: FeatureStatus) =>
    run(async () => {
      const updated = await updateFeature(feature._id, { status })
      setWarning(updated.warnings?.join('; ') || null)
    })

  const handlePriorityChange = (priority: FeaturePriority) =>
    run(async () => {
      await updateFeature(feature._id, { priority })
    })

  const handleLink = () => {
    const value = issueToLink.trim()
    if (!value) return
    run(async () => {
      await linkIssueToFeature(feature._id, value)
      setIssueToLink('')
    })
  }

  const handleUnlink = (issueId: string) =>
    run(async () => {
      await unlinkIssueFromFeature(feature._id, issueId)
    })

  if (isEditing) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Edit {feature.featureNumber}</CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureForm
            feature={{
              _id: feature._id,
              projectId: feature.projectId,
              title: feature.title,
              description: feature.description,
              acceptanceCriteria: feature.acceptanceCriteria || '',
              status: feature.status,
              priority: feature.priority,
              ownerId: feature.ownerId,
              wikiSlug: feature.wikiSlug,
              tags: feature.tags || [],
              targetDate: feature.targetDate,
            }}
            users={users}
            onSuccess={(warnings) => {
              setWarning(warnings?.join('; ') || null)
              setIsEditing(false)
            }}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-black text-primary">{feature.featureNumber}</span>
                  <FeatureStatusBadge status={feature.status} />
                  <IssuePriorityBadge priority={feature.priority} />
                </div>
                <h1 className="text-3xl font-black">{feature.title}</h1>
              </div>
              {canEdit && (
                <Button variant="outline" className="btn-outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}
            {warning && (
              <div className="bg-yellow-100 border-2 border-black p-3 text-sm font-bold">Warning: {warning}</div>
            )}

            <div>
              <h2 className="text-sm font-black uppercase mb-2">Description</h2>
              <WikiRenderer content={feature.description} />
            </div>

            {feature.acceptanceCriteria && (
              <div>
                <h2 className="text-sm font-black uppercase mb-2">Acceptance Criteria</h2>
                <WikiRenderer content={feature.acceptanceCriteria} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Linked Issues */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Linked Issues ({issues.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FeatureProgressBar progress={feature.progress} />

            {issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No issues linked yet.</p>
            ) : (
              <div className="space-y-2">
                {issues.map(issue => (
                  <div
                    key={issue._id}
                    className="flex items-center justify-between gap-3 border-2 border-black p-3 bg-white"
                  >
                    <Link href={`/issues/${issue._id}`} className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-black text-primary">{issue.issueNumber}</span>
                      <span className="font-bold truncate hover:underline">{issue.title}</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <IssueStatusBadge status={issue.status} />
                      <IssuePriorityBadge priority={issue.priority} />
                      {canEdit && (
                        <button
                          onClick={() => handleUnlink(issue._id)}
                          disabled={isPending}
                          title="Unlink issue"
                          className="p-1 hover:bg-muted disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canEdit && (
              <div className="flex gap-2">
                <Input
                  value={issueToLink}
                  onChange={(e) => setIssueToLink(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLink()}
                  placeholder="Link an existing issue by number, e.g. CUS-001"
                  disabled={isPending}
                />
                <Button className="btn-primary" onClick={handleLink} disabled={isPending || !issueToLink.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Link
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {canEdit && (
              <>
                <div>
                  <div className="text-xs font-black uppercase mb-1">Status</div>
                  <Select value={feature.status} onValueChange={(v) => handleStatusChange(v as FeatureStatus)} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {featureStatuses.map(s => (
                        <SelectItem key={s} value={s}>{featureStatusConfig[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs font-black uppercase mb-1">Priority</div>
                  <Select value={feature.priority} onValueChange={(v) => handlePriorityChange(v as FeaturePriority)} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="flex items-center gap-2 text-sm font-bold">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <Link href={`/projects/${feature.projectId}`} className="hover:underline">
                {feature.project.key} - {feature.project.name}
              </Link>
            </div>

            <div className="flex items-center gap-2 text-sm font-bold">
              <User className="h-4 w-4 text-muted-foreground" />
              Owner: {feature.owner?.name || 'Unowned'}
            </div>

            {feature.targetDate && (
              <div className="flex items-center gap-2 text-sm font-bold">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Target: {formatDate(new Date(feature.targetDate))}
              </div>
            )}

            {feature.shippedAt && (
              <div className="flex items-center gap-2 text-sm font-bold">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Shipped: {formatDate(new Date(feature.shippedAt))}
              </div>
            )}

            {feature.wikiSlug && (
              <div className="flex items-center gap-2 text-sm font-bold">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <Link href={`/wiki/${feature.wikiSlug}`} className="hover:underline">
                  Spec: {feature.wikiSlug}
                </Link>
              </div>
            )}

            {feature.tags?.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {feature.tags.map((tag: string, index: number) => (
                    <span key={index} className="badge badge-secondary text-xs">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t-2 border-black/10 text-xs text-muted-foreground font-bold space-y-1">
              <div>Created by {feature.creator.name}</div>
              <div>Created {formatDate(new Date(feature.createdAt))}</div>
              <div>Updated {formatDate(new Date(feature.updatedAt))}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
