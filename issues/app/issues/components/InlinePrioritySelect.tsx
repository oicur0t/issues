'use client'

import { useState, useTransition } from 'react'
import { IssuePriority } from '@/lib/types'
import { updateIssue } from '../actions'
import { ChevronDown } from 'lucide-react'

interface InlinePrioritySelectProps {
  issueId: string
  currentPriority: IssuePriority
  onUpdate?: () => void
}

const priorityOptions: { value: IssuePriority; label: string; color: string; textColor: string }[] = [
  { value: 'low', label: 'Low', color: '#d1d5db', textColor: 'black' },
  { value: 'medium', label: 'Medium', color: '#60a5fa', textColor: 'white' },
  { value: 'high', label: 'High', color: '#fb923c', textColor: 'black' },
  { value: 'critical', label: 'Critical', color: '#ef4444', textColor: 'white' },
]

export function InlinePrioritySelect({ issueId, currentPriority, onUpdate }: InlinePrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticPriority, setOptimisticPriority] = useState(currentPriority)

  const currentOption = priorityOptions.find(opt => opt.value === optimisticPriority)

  const handlePriorityChange = async (newPriority: IssuePriority) => {
    setIsOpen(false)
    setOptimisticPriority(newPriority)

    startTransition(async () => {
      try {
        await updateIssue(issueId, { priority: newPriority })
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update priority:', error)
        // Revert on error
        setOptimisticPriority(currentPriority)
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
          color: currentOption?.textColor,
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
            {priorityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePriorityChange(option.value)}
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
