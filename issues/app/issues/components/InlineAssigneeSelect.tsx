'use client'

import { useState, useEffect, useTransition } from 'react'
import { updateIssue } from '../actions'
import { getUsers } from '@/app/users/actions'
import { User } from '@/lib/types'
import { getUserInitials, generateAvatarColor } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'

interface InlineAssigneeSelectProps {
  issueId: string
  currentAssignee?: { _id: any; name: string; email: string }
  onUpdate?: () => void
}

export function InlineAssigneeSelect({ issueId, currentAssignee, onUpdate }: InlineAssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isPending, startTransition] = useTransition()
  const [optimisticAssignee, setOptimisticAssignee] = useState(currentAssignee)

  useEffect(() => {
    const loadUsers = async () => {
      const userData = await getUsers()
      setUsers(userData)
    }
    loadUsers()
  }, [])

  const handleAssigneeChange = async (userId: string | null) => {
    setIsOpen(false)
    const foundUser = userId ? users.find(u => u._id?.toString() === userId) : undefined
    const newAssignee = foundUser ? {
      _id: foundUser._id!,
      name: foundUser.name,
      email: foundUser.email
    } : undefined
    setOptimisticAssignee(newAssignee)

    startTransition(async () => {
      try {
        await updateIssue(issueId, { assigneeId: userId || undefined })
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update assignee:', error)
        setOptimisticAssignee(currentAssignee)
      }
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 p-2 hover:bg-muted rounded transition-colors disabled:opacity-50"
      >
        {optimisticAssignee ? (
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 border-3 border-black flex items-center justify-center text-white text-sm font-medium ${generateAvatarColor(optimisticAssignee.email)}`}
              style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              {getUserInitials(optimisticAssignee.name)}
            </div>
            <div className="text-left">
              <div className="font-black text-sm">{optimisticAssignee.name}</div>
              <div className="text-xs text-muted-foreground">{optimisticAssignee.email}</div>
            </div>
            <ChevronDown className="h-4 w-4 ml-2" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-muted-foreground">Unassigned</div>
            <ChevronDown className="h-4 w-4" />
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute left-0 top-full mt-1 z-20 border-4 border-black bg-white max-h-64 overflow-y-auto"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)', minWidth: '250px' }}
          >
            {optimisticAssignee && (
              <button
                onClick={() => handleAssigneeChange(null)}
                className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-100 transition-colors border-b-2 border-gray-200 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Unassign
              </button>
            )}
            {users.map((user) => (
              <button
                key={user._id?.toString()}
                onClick={() => handleAssigneeChange(user._id?.toString() || '')}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3"
              >
                <div
                  className={`h-6 w-6 border-2 border-black flex items-center justify-center text-white text-xs font-medium ${generateAvatarColor(user.email)}`}
                >
                  {getUserInitials(user.name)}
                </div>
                <div>
                  <div className="font-bold text-sm">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
