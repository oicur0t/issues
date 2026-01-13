'use client'

import { Button } from './button'
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react'

interface DialogAlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  buttonText?: string
  variant?: 'success' | 'error' | 'warning' | 'info'
}

export function DialogAlert({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK',
  variant = 'info'
}: DialogAlertProps) {
  if (!isOpen) return null

  const variantConfig = {
    success: {
      bg: 'bg-green-300',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-red-300',
      icon: AlertCircle
    },
    warning: {
      bg: 'bg-yellow-300',
      icon: AlertTriangle
    },
    info: {
      bg: 'bg-cyan-300',
      icon: Info
    }
  }

  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md mx-4 p-6 border-4 border-black ${config.bg}`}
        style={{ boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-black/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon and Title */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="p-2 bg-white border-3 border-black"
            style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            <Icon className="h-6 w-6 text-black" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black uppercase">{title}</h2>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-base font-bold whitespace-pre-line">{message}</p>
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
