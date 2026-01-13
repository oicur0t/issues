'use client'

import { useState } from 'react'
import { CreateIssueData, UpdateIssueData, IssuePriority, IssueStatus, User } from '@/lib/types'
import { createIssue, updateIssue } from '../actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PrioritySelect } from '@/components/ui/priority-select'
import { StatusSelect } from '@/components/ui/status-select'

interface IssueFormProps {
  issue?: {
    _id: string
    projectId: string
    title: string
    description: string
    status: IssueStatus
    priority: IssuePriority
    assigneeId?: string
    tags: string[]
    dueDate?: Date
  }
  projects?: Array<{
    _id?: any
    name: string
    key: string
  }>
  defaultProjectId?: string
  users?: Array<{
    _id?: any
    name: string
    email: string
  }>
  onSuccess?: () => void
  onCancel?: () => void
}

export function IssueForm({ issue, projects = [], defaultProjectId, users = [], onSuccess, onCancel }: IssueFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    projectId: issue?.projectId || defaultProjectId || '',
    title: issue?.title || '',
    description: issue?.description || '',
    priority: issue?.priority || 'medium' as IssuePriority,
    status: issue?.status || 'open' as IssueStatus,
    assigneeId: issue?.assigneeId || '',
    tags: issue?.tags?.join(', ') || '',
    dueDate: issue?.dueDate ? new Date(issue.dueDate).toISOString().split('T')[0] : '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const submitData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority as IssuePriority,
        status: formData.status as IssueStatus,
        assigneeId: formData.assigneeId || undefined,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      }

      if (issue) {
        // Update existing issue
        await updateIssue(issue._id, submitData as UpdateIssueData)
      } else {
        // Create new issue
        if (!formData.projectId) {
          throw new Error('Please select a project')
        }
        submitData.projectId = formData.projectId
        await createIssue(submitData as CreateIssueData)
      }

      onSuccess?.()
      router.push('/issues')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {!issue && (
        <div className="form-group">
          <Label htmlFor="project" className="font-bold">Project *</Label>
          <Select
            value={formData.projectId}
            onValueChange={(value) => handleInputChange('projectId', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project._id?.toString()} value={project._id?.toString()}>
                  {project.key} - {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            The project determines the issue number (e.g., CUS-001)
          </p>
        </div>
      )}

      <div className="form-group">
        <Label htmlFor="title" className="font-bold">Title *</Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter issue title"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe the issue in detail"
          rows={6}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <Label htmlFor="priority">Priority</Label>
          <PrioritySelect
            value={formData.priority}
            onValueChange={(value) => handleInputChange('priority', value)}
            disabled={isSubmitting}
          />
        </div>

        {issue && (
          <div className="form-group">
            <Label htmlFor="status">Status</Label>
            <StatusSelect
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={formData.assigneeId || 'unassigned'}
            onValueChange={(value) => handleInputChange('assigneeId', value === 'unassigned' ? '' : value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user._id?.toString()} value={user._id?.toString() || 'unassigned'}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="form-group">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={(e) => handleInputChange('dueDate', e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="form-group">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          type="text"
          value={formData.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          placeholder="Enter tags separated by commas (e.g., bug, frontend, urgent)"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate multiple tags with commas
        </p>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? 'Saving...' : issue ? 'Update Issue' : 'Create Issue'}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn-outline"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}