'use client'

import { IssueStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface IssueStatusBadgeProps {
  status: IssueStatus
  className?: string
}

const statusConfig = {
  backlog: {
    label: 'Backlog',
    className: 'status-backlog',
  },
  in_progress: {
    label: 'In Progress',
    className: 'status-in-progress',
  },
  blocked: {
    label: 'Blocked',
    className: 'status-blocked',
  },
  fixed: {
    label: 'Fixed',
    className: 'status-fixed',
  },
  wont_fix: {
    label: "Won't Fix",
    className: 'status-wont-fix',
  },
}

export function IssueStatusBadge({ status, className }: IssueStatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <span className={cn('badge', config.className, className)}>
      {config.label}
    </span>
  )
}