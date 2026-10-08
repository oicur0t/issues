'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeatureStatus, FeaturePriority } from '@/lib/types'
import { createFeature, updateFeature } from '../actions'
import { featureStatuses, featureStatusConfig } from './FeatureBadges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FeatureFormProps {
  feature?: {
    _id: string
    projectId: string
    title: string
    description: string
    acceptanceCriteria: string
    status: FeatureStatus
    priority: FeaturePriority
    ownerId?: string
    wikiSlug?: string
    tags: string[]
    targetDate?: string
  }
  projects?: Array<{ _id: string; name: string; key: string }>
  users?: Array<{ _id: string; name: string }>
  onSuccess?: (warnings?: string[]) => void
  onCancel?: () => void
}

const NO_OWNER = 'none'

export function FeatureForm({ feature, projects = [], users = [], onSuccess, onCancel }: FeatureFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    projectId: feature?.projectId || '',
    title: feature?.title || '',
    description: feature?.description || '',
    acceptanceCriteria: feature?.acceptanceCriteria || '',
    status: feature?.status || ('proposed' as FeatureStatus),
    priority: feature?.priority || ('medium' as FeaturePriority),
    ownerId: feature?.ownerId || NO_OWNER,
    wikiSlug: feature?.wikiSlug || '',
    tags: feature?.tags?.join(', ') || '',
    targetDate: feature?.targetDate ? feature.targetDate.slice(0, 10) : '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      const ownerId = formData.ownerId === NO_OWNER ? undefined : formData.ownerId

      if (feature) {
        const updated = await updateFeature(feature._id, {
          title: formData.title,
          description: formData.description,
          acceptanceCriteria: formData.acceptanceCriteria,
          status: formData.status,
          priority: formData.priority,
          ownerId: ownerId ?? null,
          wikiSlug: formData.wikiSlug,
          tags,
          targetDate: formData.targetDate ? new Date(formData.targetDate) : null,
        })
        router.refresh()
        onSuccess?.(updated.warnings)
      } else {
        if (!formData.projectId) {
          throw new Error('Please select a project')
        }
        const created = await createFeature({
          projectId: formData.projectId,
          title: formData.title,
          description: formData.description,
          acceptanceCriteria: formData.acceptanceCriteria,
          status: formData.status,
          priority: formData.priority,
          ownerId,
          wikiSlug: formData.wikiSlug,
          tags,
          targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
        })
        router.push(`/features/${created._id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save feature')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>
      )}

      {!feature && (
        <div className="form-group">
          <Label htmlFor="project" className="font-bold">Project *</Label>
          <Select
            value={formData.projectId}
            onValueChange={(value) => handleChange('projectId', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p._id} value={p._id}>
                  {p.key} - {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="form-group">
        <Label htmlFor="title" className="font-bold">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., CSV export for reports"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <Label htmlFor="description" className="font-bold">Description * (markdown)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="What problem does this solve? What should it do?"
          rows={6}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <Label htmlFor="acceptanceCriteria" className="font-bold">Acceptance Criteria (markdown checklist)</Label>
        <Textarea
          id="acceptanceCriteria"
          value={formData.acceptanceCriteria}
          onChange={(e) => handleChange('acceptanceCriteria', e.target.value)}
          placeholder={'- [ ] User can export from the reports page\n- [ ] File opens in Excel'}
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="form-group">
          <Label className="font-bold">Status</Label>
          <Select value={formData.status} onValueChange={(v) => handleChange('status', v)} disabled={isSubmitting}>
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

        <div className="form-group">
          <Label className="font-bold">Priority</Label>
          <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)} disabled={isSubmitting}>
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

        <div className="form-group">
          <Label className="font-bold">Owner</Label>
          <Select value={formData.ownerId} onValueChange={(v) => handleChange('ownerId', v)} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_OWNER}>Unowned</SelectItem>
              {users.map(u => (
                <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <Label htmlFor="targetDate" className="font-bold">Target Date</Label>
          <Input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => handleChange('targetDate', e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <Label htmlFor="wikiSlug" className="font-bold">Spec Wiki Page (slug)</Label>
          <Input
            id="wikiSlug"
            value={formData.wikiSlug}
            onChange={(e) => handleChange('wikiSlug', e.target.value)}
            placeholder="e.g., csv-export-design"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="form-group">
        <Label htmlFor="tags" className="font-bold">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => handleChange('tags', e.target.value)}
          placeholder="e.g., reporting, export"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : feature ? 'Save Changes' : 'Create Feature'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" className="btn-outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
