'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { IssuePriority } from '@/lib/types'
import { AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PrioritySelectProps {
  value: IssuePriority
  onValueChange: (value: IssuePriority) => void
  disabled?: boolean
}

const priorityConfig = {
  low: {
    label: 'Low',
    icon: ArrowDown,
    color: '#d1d5db',
    textColor: '#000000',
  },
  medium: {
    label: 'Medium',
    icon: ArrowUp,
    color: '#60a5fa',
    textColor: '#ffffff',
  },
  high: {
    label: 'High',
    icon: ArrowUp,
    color: '#fb923c',
    textColor: '#000000',
  },
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    color: '#ef4444',
    textColor: '#ffffff',
  },
}

export function PrioritySelect({ value, onValueChange, disabled }: PrioritySelectProps) {
  const selectedConfig = priorityConfig[value]
  const Icon = selectedConfig.icon

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        style={{
          backgroundColor: selectedConfig.color,
          color: selectedConfig.textColor,
        }}
      >
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {selectedConfig.label}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(priorityConfig) as [IssuePriority, typeof priorityConfig.low][]).map(
          ([key, config]) => {
            const ItemIcon = config.icon
            return (
              <SelectItem
                key={key}
                value={key}
                className="mb-2 last:mb-0"
                style={{
                  backgroundColor: config.color,
                  color: config.textColor,
                  border: '3px solid black',
                  boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                }}
              >
                <div className="flex items-center gap-2">
                  <ItemIcon className="h-4 w-4" />
                  {config.label}
                </div>
              </SelectItem>
            )
          }
        )}
      </SelectContent>
    </Select>
  )
}
