'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProject } from '../../actions'
import { Button } from '@/components/ui/button'
import { DialogConfirm } from '@/components/ui/dialog-confirm'
import { DialogAlert } from '@/components/ui/dialog-alert'
import { Trash2 } from 'lucide-react'

interface DeleteProjectButtonProps {
  projectId: string
  projectName: string
  issueCount: number
}

export function DeleteProjectButton({ projectId, projectName, issueCount }: DeleteProjectButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', variant: 'error' as 'error' | 'warning' })

  const handleDeleteClick = () => {
    if (issueCount > 0) {
      setAlertMessage({
        title: 'Cannot Delete Project',
        message: `Cannot delete project "${projectName}" because it has ${issueCount} issue${issueCount !== 1 ? 's' : ''}.\n\nPlease delete or reassign all issues before deleting the project.`,
        variant: 'warning'
      })
      setShowAlert(true)
      return
    }

    setShowConfirm(true)
  }

  const handleConfirmDelete = () => {
    startTransition(async () => {
      try {
        await deleteProject(projectId)
        router.push('/projects')
        router.refresh()
      } catch (error) {
        console.error('Failed to delete project:', error)
        setAlertMessage({
          title: 'Delete Failed',
          message: error instanceof Error ? error.message : 'Failed to delete project',
          variant: 'error'
        })
        setShowAlert(true)
      }
    })
  }

  return (
    <>
      <Button
        variant="destructive"
        className="btn-destructive"
        onClick={handleDeleteClick}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        {isPending ? 'Deleting...' : 'Delete'}
      </Button>

      <DialogConfirm
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${projectName}"?\n\nThis action cannot be undone.`}
        confirmText="Delete Project"
        cancelText="Cancel"
        variant="danger"
      />

      <DialogAlert
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title={alertMessage.title}
        message={alertMessage.message}
        variant={alertMessage.variant}
      />
    </>
  )
}
