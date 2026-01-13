'use client'

import { Button } from './button'
import { AlertTriangle, X } from 'lucide-react'

interface DialogConfirmProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export function DialogConfirm({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning'
}: DialogConfirmProps) {
  if (!isOpen) return null

  const variantStyles = {
    danger: 'bg-red-300',
    warning: 'bg-yellow-300',
    info: 'bg-cyan-300'
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md mx-4 p-6 border-4 border-black ${variantStyles[variant]}`}
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
            <AlertTriangle className="h-6 w-6 text-black" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black uppercase">{title}</h2>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-base font-bold whitespace-pre-line">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            className="border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
            style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
