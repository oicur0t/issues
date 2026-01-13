'use client'

import { useState, useTransition } from 'react'
import { IssueStatus } from '@/lib/types'
import { updateIssue } from '../actions'
import { ChevronDown } from 'lucide-react'

interface InlineStatusSelectProps {
  issueId: string
  currentStatus: IssueStatus
  onUpdate?: () => void
}

const statusOptions: { value: IssueStatus; label: string; color: string }[] = [
  { value: 'backlog', label: 'Backlog', color: '#94a3b8' },
  { value: 'in_progress', label: 'In Progress', color: '#facc15' },
  { value: 'blocked', label: 'Blocked', color: '#f87171' },
  { value: 'fixed', label: 'Fixed', color: '#4ade80' },
  { value: 'wont_fix', label: "Won't Fix", color: '#6b7280' },
]

export function InlineStatusSelect({ issueId, currentStatus, onUpdate }: InlineStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus)

  const currentOption = statusOptions.find(opt => opt.value === optimisticStatus)

  const handleStatusChange = async (newStatus: IssueStatus) => {
    setIsOpen(false)
    setOptimisticStatus(newStatus)

    startTransition(async () => {
      try {
        await updateIssue(issueId, { status: newStatus })
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update status:', error)
        // Revert on error
        setOptimisticStatus(currentStatus)
      }
    })
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="inline-flex items-center px-3 py-1 text-xs font-black border-3 border-black transition-all hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50"
        style={{
          backgroundColor: currentOption?.color,
          color: optimisticStatus === 'blocked' ? 'white' : 'black',
          boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)',
        }}
      >
        {currentOption?.label}
        <ChevronDown className="ml-1 h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute left-0 top-full mt-1 z-20 border-4 border-black bg-white"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)', minWidth: '150px' }}
          >
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-100 transition-colors"
                style={{
                  borderLeft: `4px solid ${option.color}`,
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
