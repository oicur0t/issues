'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createUser, updateUser } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserRole } from '@/lib/types'

interface UserFormProps {
  user?: {
    _id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
    isActive: boolean
  }
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>('')
  const [createdApiKey, setCreatedApiKey] = useState<string>('')

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>(user?.role || 'viewer')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('User name is required')
      return
    }

    if (!email.trim()) {
      setError('User email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    // Password validation only for new users
    if (!user) {
      if (!password) {
        setError('Password is required')
        return
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters long')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    startTransition(async () => {
      try {
        if (user) {
          await updateUser(user._id, {
            name: name.trim(),
            email: email.trim(),
            role,
            avatar: avatar.trim() || undefined,
            isActive,
          })
          router.push('/users')
          router.refresh()
        } else {
          const result = await createUser({
            name: name.trim(),
            email: email.trim(),
            password: password,
            role,
            avatar: avatar.trim() || undefined,
          })
          // Show the API key
          setCreatedApiKey(result.apiKey)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save user')
      }
    })
  }

  // If API key was just created, show it
  if (createdApiKey) {
    return (
      <div className="space-y-6">
        <div
          className="p-6 bg-green-100 border-4 border-green-600"
          style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          <h3 className="text-2xl font-black mb-4">User Created Successfully!</h3>
          <p className="font-bold mb-4">
            User <span className="text-green-600">{name}</span> has been created.
          </p>
          <p className="font-bold text-destructive mb-2">
            ⚠️ Save this API key now - it will not be shown again!
          </p>
          <div className="p-4 bg-white border-2 border-black font-mono text-sm break-all">
            {createdApiKey}
          </div>
        </div>

        <Button
          onClick={() => router.push('/users')}
          className="btn-primary"
        >
          Go to Users List
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="p-4 bg-destructive/10 border-4 border-destructive text-destructive font-bold"
          style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="font-bold">
          Name *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          disabled={isPending}
          required
        />
        <p className="text-sm text-muted-foreground">
          The full name of the user
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="font-bold">
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john.doe@example.com"
          disabled={isPending}
          required
        />
        <p className="text-sm text-muted-foreground">
          The email address for this user (must be unique)
        </p>
      </div>

      {!user && (
        <>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold">
              Password *
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a secure password"
              disabled={isPending}
              required
            />
            <p className="text-sm text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-bold">
              Confirm Password *
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter the password"
              disabled={isPending}
              required
            />
            <p className="text-sm text-muted-foreground">
              Must match the password above
            </p>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="role" className="font-bold">
          Role *
        </Label>
        <Select
          value={role}
          onValueChange={(value) => setRole(value as UserRole)}
          disabled={isPending}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin - Full system access</SelectItem>
            <SelectItem value="developer">Developer - Can create and manage issues</SelectItem>
            <SelectItem value="tester">Tester - Can create and test issues</SelectItem>
            <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          The user's role determines their permissions in the system
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar" className="font-bold">
          Avatar URL
        </Label>
        <Input
          id="avatar"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          disabled={isPending}
        />
        <p className="text-sm text-muted-foreground">
          Optional URL to the user's avatar image
        </p>
      </div>

      {user && (
        <div className="space-y-2">
          <Label htmlFor="isActive" className="font-bold">
            Status
          </Label>
          <Select
            value={isActive ? 'active' : 'inactive'}
            onValueChange={(value) => setIsActive(value === 'active')}
            disabled={isPending}
          >
            <SelectTrigger id="isActive">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active - User can log in</SelectItem>
              <SelectItem value="inactive">Inactive - User cannot log in</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Inactive users cannot log in to the system
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isPending}
          className="btn-primary"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {user ? 'Update User' : 'Create User'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
          className="btn-outline"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
