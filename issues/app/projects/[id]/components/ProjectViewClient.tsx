'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { FolderKanban } from 'lucide-react'
import { InlineProjectNameEdit } from './InlineProjectNameEdit'
import { InlineProjectDescriptionEdit } from './InlineProjectDescriptionEdit'

interface ProjectViewClientProps {
  id: string
  name: string
  key_: string
  description: string
  canEdit: boolean
}

export function ProjectViewClient({
  id,
  name,
  key_,
  description,
  canEdit
}: ProjectViewClientProps) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 bg-primary border-4 border-black flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              <span className="text-white font-black text-xl">
                {key_}
              </span>
            </div>
            <div className="flex-1">
              {canEdit ? (
                <InlineProjectNameEdit
                  projectId={id}
                  currentName={name}
                  onUpdate={handleUpdate}
                />
              ) : (
                <h1 className="text-3xl font-black">{name}</h1>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {canEdit ? (
          <InlineProjectDescriptionEdit
            projectId={id}
            currentDescription={description}
            onUpdate={handleUpdate}
          />
        ) : description ? (
          <p className="text-muted-foreground">{description}</p>
        ) : (
          <p className="text-muted-foreground italic">No description provided</p>
        )}
      </CardContent>
    </Card>
  )
}
