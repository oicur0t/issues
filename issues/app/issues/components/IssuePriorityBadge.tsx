'use client'

import { IssuePriority } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'

interface IssuePriorityBadgeProps {
  priority: IssuePriority
  className?: string
}

const priorityConfig = {
  low: {
    label: 'Low',
    className: 'priority-low',
    icon: ArrowDown,
  },
  medium: {
    label: 'Medium',
    className: 'priority-medium',
    icon: ArrowUp,
  },
  high: {
    label: 'High',
    className: 'priority-high',
    icon: ArrowUp,
  },
  critical: {
    label: 'Critical',
    className: 'priority-critical',
    icon: AlertTriangle,
  },
}

export function IssuePriorityBadge({ priority, className }: IssuePriorityBadgeProps) {
  const config = priorityConfig[priority]
  const Icon = config.icon
  
  return (
    <span className={cn('badge flex items-center gap-1', config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}