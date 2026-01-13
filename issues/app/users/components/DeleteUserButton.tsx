'use client'

import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteUser } from '../actions'
import { useTransition } from 'react'

interface DeleteUserButtonProps {
  userId: string
  userName: string
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete ${userName}?`)) {
      return
    }

    startTransition(async () => {
      await deleteUser(userId)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="btn-ghost text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
