'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProject, updateProject } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface ProjectFormProps {
  project?: {
    _id: string
    name: string
    key: string
    description: string
  }
}

export function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>('')

  const [name, setName] = useState(project?.name || '')
  const [key, setKey] = useState(project?.key || '')
  const [description, setDescription] = useState(project?.description || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Project name is required')
      return
    }

    if (!key.trim()) {
      setError('Project key is required')
      return
    }

    const keyRegex = /^[A-Z]{2,5}$/
    const trimmedKey = key.trim().toUpperCase()
    if (!keyRegex.test(trimmedKey)) {
      setError('Project key must be 2-5 uppercase letters (e.g., CUS, PROJ)')
      return
    }

    startTransition(async () => {
      try {
        if (project) {
          await updateProject(project._id, {
            name: name.trim(),
            key: trimmedKey,
            description: description.trim(),
          })
          router.push(`/projects/${project._id}`)
          router.refresh()
        } else {
          const newProject = await createProject({
            name: name.trim(),
            key: trimmedKey,
            description: description.trim(),
          })
          router.push(`/projects/${newProject._id?.toString()}`)
          router.refresh()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save project')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="p-4 bg-destructive/10 border-4 border-destructive text-destructive font-bold"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="font-bold">
          Project Name *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer Portal"
          disabled={isPending}
          required
        />
        <p className="text-sm text-muted-foreground">
          A descriptive name for your project
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="key" className="font-bold">
          Project Key *
        </Label>
        <Input
          id="key"
          value={key}
          onChange={(e) => setKey(e.target.value.toUpperCase())}
          placeholder="CUS"
          maxLength={5}
          disabled={isPending}
          required
          className="uppercase"
        />
        <p className="text-sm text-muted-foreground">
          2-5 uppercase letters used for issue numbering (e.g., CUS-001)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="font-bold">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what this project is about..."
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {project ? 'Update Project' : 'Create Project'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="btn-outline"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
