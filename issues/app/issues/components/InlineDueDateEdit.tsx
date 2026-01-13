'use client'

import { useState, useTransition } from 'react'
import { updateIssue } from '../actions'
import { formatDate } from '@/lib/utils'
import { Calendar, X } from 'lucide-react'

interface InlineDueDateEditProps {
  issueId: string
  currentDueDate?: Date
  onUpdate?: () => void
}

export function InlineDueDateEdit({ issueId, currentDueDate, onUpdate }: InlineDueDateEditProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [optimisticDueDate, setOptimisticDueDate] = useState(currentDueDate)

  const handleDateChange = async (dateString: string | null) => {
    setIsOpen(false)
    const newDate = dateString ? new Date(dateString) : undefined
    setOptimisticDueDate(newDate)

    startTransition(async () => {
      try {
        await updateIssue(issueId, { dueDate: newDate })
        onUpdate?.()
      } catch (error) {
        console.error('Failed to update due date:', error)
        setOptimisticDueDate(currentDueDate)
      }
    })
  }

  const handleClear = () => {
    handleDateChange(null)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 p-2 hover:bg-muted rounded transition-colors disabled:opacity-50"
      >
        <Calendar className="h-4 w-4" />
        <span className="font-bold text-sm">
          {optimisticDueDate ? formatDate(optimisticDueDate) : 'No due date'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute left-0 top-full mt-1 z-20 border-4 border-black bg-white p-4"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)', minWidth: '250px' }}
          >
            <input
              type="date"
              defaultValue={optimisticDueDate ? optimisticDueDate.toISOString().split('T')[0] : ''}
              onChange={(e) => handleDateChange(e.target.value || null)}
              className="w-full h-10 border-4 border-black bg-white px-3 py-2 text-sm font-bold focus:outline-none mb-2"
              style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
            />
            {optimisticDueDate && (
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 bg-muted text-black border-2 border-black font-black hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
              >
                <X className="h-4 w-4" />
                Clear Due Date
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
