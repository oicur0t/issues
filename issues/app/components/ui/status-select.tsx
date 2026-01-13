'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { IssueStatus } from '@/lib/types'

interface StatusSelectProps {
  value: IssueStatus
  onValueChange: (value: IssueStatus) => void
  disabled?: boolean
}

const statusConfig = {
  backlog: {
    label: 'Backlog',
    color: '#94a3b8',
    textColor: '#000000',
  },
  in_progress: {
    label: 'In Progress',
    color: '#facc15',
    textColor: '#000000',
  },
  blocked: {
    label: 'Blocked',
    color: '#f87171',
    textColor: '#ffffff',
  },
  fixed: {
    label: 'Fixed',
    color: '#4ade80',
    textColor: '#000000',
  },
  wont_fix: {
    label: "Won't Fix",
    color: '#6b7280',
    textColor: '#000000',
  },
}

export function StatusSelect({ value, onValueChange, disabled }: StatusSelectProps) {
  const selectedConfig = statusConfig[value]

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        style={{
          backgroundColor: selectedConfig.color,
          color: selectedConfig.textColor,
        }}
      >
        <SelectValue>
          {selectedConfig.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(statusConfig) as [IssueStatus, typeof statusConfig.backlog][]).map(
          ([key, config]) => {
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
                {config.label}
              </SelectItem>
            )
          }
        )}
      </SelectContent>
    </Select>
  )
}
