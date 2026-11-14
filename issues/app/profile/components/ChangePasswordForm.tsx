'use client'

import { useState, useTransition } from 'react'
import { changeMyPassword } from '@/app/users/actions'
import { validatePasswordChange } from '@/lib/password'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)

    const validationError = validatePasswordChange(currentPassword, newPassword, confirmPassword)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        const result = await changeMyPassword(currentPassword, newPassword, confirmPassword)
        if (result.success) {
          setSuccess(true)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        } else {
          setError(result.error ?? 'Could not change password')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not change password')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          disabled={isPending}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm font-bold">
          Password changed. Use it the next time you sign in.
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="font-black border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
        style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
      >
        {isPending ? 'Changing...' : 'Change password'}
      </Button>
    </form>
  )
}
