'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Key, Trash2, Power, Copy, Check, AlertCircle } from 'lucide-react'
import { createApiKey, listApiKeys, deleteApiKey, toggleApiKeyStatus } from './actions'
import { ApiKeyPermission } from '@/lib/types'

export function ApiKeysManager() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<ApiKeyPermission[]>([])
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  const allPermissions: ApiKeyPermission[] = [
    'projects:read',
    'projects:write',
    'issues:read',
    'issues:write',
    'wiki:read',
    'wiki:write',
    'users:read',
    'assets:read',
    'assets:write',
  ]

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    setLoading(true)
    const data = await listApiKeys()
    setKeys(data)
    setLoading(false)
  }

  async function handleCreate() {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key')
      return
    }

    if (selectedPermissions.length === 0) {
      alert('Please select at least one permission')
      return
    }

    const result = await createApiKey({
      name: newKeyName,
      permissions: selectedPermissions,
    })

    if (result.success && result.key) {
      setCreatedKey(result.key)
      setNewKeyName('')
      setSelectedPermissions([])
      await loadKeys()
    } else {
      alert('Error: ' + result.error)
    }
  }

  async function handleDelete(keyId: string) {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) {
      return
    }

    const result = await deleteApiKey(keyId)
    if (result.success) {
      await loadKeys()
    } else {
      alert('Error: ' + result.error)
    }
  }

  async function handleToggleStatus(keyId: string) {
    const result = await toggleApiKeyStatus(keyId)
    if (result.success) {
      await loadKeys()
    } else {
      alert('Error: ' + result.error)
    }
  }

  function togglePermission(permission: ApiKeyPermission) {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission))
    } else {
      setSelectedPermissions([...selectedPermissions, permission])
    }
  }

  async function copyKey() {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Created Key Display */}
      {createdKey && (
        <Card className="border-green-500 border-2 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <Check className="h-5 w-5" />
              API Key Created Successfully
            </CardTitle>
            <CardDescription className="text-green-600">
              Copy this key now - you won't be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={createdKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={copyKey} variant="outline">
                {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={() => setCreatedKey(null)} className="w-full">
              I've Saved the Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create New Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Create New Service API Key
          </CardTitle>
          <CardDescription>
            Generate a new API key for services (phone-home scripts, CI/CD pipelines, automation)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>
              Create New API Key
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Phone-Home Script, CI/CD Pipeline"
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {allPermissions.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded"
                      />
                      <span className="text-sm">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreate}>
                  Create Key
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing API Keys</CardTitle>
          <CardDescription>
            Manage your API keys. Keys are shown masked for security.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : keys.length === 0 ? (
            <p className="text-muted-foreground">No API keys created yet.</p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key._id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{key.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created by {key.user?.name} ({key.user?.email})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                      {key.lastUsedAt && (
                        <p className="text-sm text-muted-foreground">
                          Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                        </p>
                      )}
                      {key.expiresAt && (
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(key.expiresAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={key.isActive ? "outline" : "default"}
                        onClick={() => handleToggleStatus(key._id)}
                        title={key.isActive ? "Disable key" : "Enable key"}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(key._id)}
                        title="Delete key"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Permissions:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {key.permissions.map((perm: string) => (
                        <span
                          key={perm}
                          className="text-xs bg-secondary px-2 py-1 rounded"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {key.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Using API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <p>Include the API key in the Authorization header:</p>
          <pre className="bg-blue-100 p-2 rounded font-mono text-xs overflow-x-auto">
Authorization: Bearer iak_your_api_key_here
          </pre>
          <p className="mt-2">Example with curl:</p>
          <pre className="bg-blue-100 p-2 rounded font-mono text-xs overflow-x-auto">
curl -H "Authorization: Bearer iak_xxx" http://wopr:3000/api/v1/assets/phone-home
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
