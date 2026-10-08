'use client'

import { useState } from 'react'
import { CreateAssetData, UpdateAssetData, AssetStatus, AssetAccount } from '@/lib/types'
import { createAsset, updateAsset } from '../actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X } from 'lucide-react'

interface AssetFormProps {
  asset?: {
    _id: string
    name: string
    hostname?: string
    ipAddresses: string[]
    type: string
    status: AssetStatus
    os?: string
    provider?: string
    location?: string
    cost?: number
    vendorUrl?: string
    accounts: AssetAccount[]
    description?: string
    projects: Array<{ _id?: any; key?: string; name?: string; role: string }>
    tags: string[]
  }
  projects?: Array<{
    _id?: any
    name: string
    key: string
  }>
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssetForm({ asset, projects = [], onSuccess, onCancel }: AssetFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: asset?.name || '',
    hostname: asset?.hostname || '',
    ipAddresses: asset?.ipAddresses?.join(', ') || '',
    type: asset?.type || '',
    status: asset?.status || 'active' as AssetStatus,
    os: asset?.os || '',
    provider: asset?.provider || '',
    location: asset?.location || '',
    cost: asset?.cost?.toString() || '',
    vendorUrl: asset?.vendorUrl || '',
    accounts: asset?.accounts || [] as AssetAccount[],
    description: asset?.description || '',
    projects: asset?.projects?.map(p => ({
      projectId: p._id?.toString() || '',
      role: p.role || ''
    })) || [] as Array<{ projectId: string; role: string }>,
    tags: asset?.tags?.join(', ') || '',
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const addAccount = () => {
    setFormData(prev => ({
      ...prev,
      accounts: [...prev.accounts, { key: '', value: '' }]
    }))
  }

  const updateAccount = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      accounts: prev.accounts.map((acc, i) =>
        i === index ? { ...acc, [field]: value } : acc
      )
    }))
  }

  const removeAccount = (index: number) => {
    setFormData(prev => ({
      ...prev,
      accounts: prev.accounts.filter((_, i) => i !== index)
    }))
  }

  const toggleProject = (projectId: string) => {
    setFormData(prev => {
      const exists = prev.projects.find(p => p.projectId === projectId)
      if (exists) {
        return {
          ...prev,
          projects: prev.projects.filter(p => p.projectId !== projectId)
        }
      } else {
        return {
          ...prev,
          projects: [...prev.projects, { projectId, role: '' }]
        }
      }
    })
  }

  const updateProjectRole = (projectId: string, role: string) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.map(p =>
        p.projectId === projectId ? { ...p, role } : p
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const submitData: any = {
        name: formData.name.trim(),
        hostname: formData.hostname.trim() || undefined,
        ipAddresses: formData.ipAddresses
          .split(',')
          .map(ip => ip.trim())
          .filter(ip => ip.length > 0),
        type: formData.type.trim(),
        status: formData.status,
        os: formData.os.trim() || undefined,
        provider: formData.provider.trim() || undefined,
        location: formData.location.trim() || undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        vendorUrl: formData.vendorUrl.trim() || undefined,
        accounts: formData.accounts.filter(acc => acc.key.trim() && acc.value.trim()),
        description: formData.description.trim() || undefined,
        projects: formData.projects
          .filter(p => p.projectId && p.role.trim())
          .map(p => ({ projectId: p.projectId, role: p.role.trim() })),
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
      }

      if (asset) {
        // Update existing asset
        await updateAsset(asset._id, submitData as UpdateAssetData)
      } else {
        // Create new asset
        await createAsset(submitData as CreateAssetData)
      }

      onSuccess?.()
      router.push('/assets')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Name & Type Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <Label htmlFor="name" className="font-bold">Asset Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., production-web-01"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <Label htmlFor="type" className="font-bold">Type *</Label>
          <Input
            id="type"
            type="text"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            placeholder="e.g., host, container, pod, integration"
            required
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Flexible type - enter any value
          </p>
        </div>
      </div>

      {/* Status Row */}
      <div className="form-group">
        <Label htmlFor="status" className="font-bold">Status *</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleInputChange('status', value as AssetStatus)}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="decommissioned">Decommissioned</SelectItem>
            <SelectItem value="removed">Removed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hostname & OS Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <Label htmlFor="hostname" className="font-bold">Hostname</Label>
          <Input
            id="hostname"
            type="text"
            value={formData.hostname}
            onChange={(e) => handleInputChange('hostname', e.target.value)}
            placeholder="e.g., web-server.example.com"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <Label htmlFor="os" className="font-bold">Operating System</Label>
          <Input
            id="os"
            type="text"
            value={formData.os}
            onChange={(e) => handleInputChange('os', e.target.value)}
            placeholder="e.g., Ubuntu 22.04"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* IP Addresses */}
      <div className="form-group">
        <Label htmlFor="ipAddresses" className="font-bold">IP Addresses</Label>
        <Input
          id="ipAddresses"
          type="text"
          value={formData.ipAddresses}
          onChange={(e) => handleInputChange('ipAddresses', e.target.value)}
          placeholder="Comma-separated: 192.168.1.10, 10.0.0.5"
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate multiple IP addresses with commas
        </p>
      </div>

      {/* Provider & Location Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <Label htmlFor="provider" className="font-bold">Provider</Label>
          <Input
            id="provider"
            type="text"
            value={formData.provider}
            onChange={(e) => handleInputChange('provider', e.target.value)}
            placeholder="e.g., AWS, DigitalOcean"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <Label htmlFor="location" className="font-bold">Location</Label>
          <Input
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="e.g., us-east-1"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Cost & Vendor URL Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <Label htmlFor="cost" className="font-bold">Cost (Monthly/Annual)</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => handleInputChange('cost', e.target.value)}
            placeholder="e.g., 49.99"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <Label htmlFor="vendorUrl" className="font-bold">Vendor URL</Label>
          <Input
            id="vendorUrl"
            type="url"
            value={formData.vendorUrl}
            onChange={(e) => handleInputChange('vendorUrl', e.target.value)}
            placeholder="https://portal.provider.com"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Accounts (Key-Value Pairs) */}
      <div className="form-group">
        <div className="flex items-center justify-between mb-2">
          <Label className="font-bold">Accounts</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAccount}
            disabled={isSubmitting}
            className="btn-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Account
          </Button>
        </div>
        <div className="border-2 border-black rounded-md p-4 space-y-3">
          {formData.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No accounts added. Click "Add Account" to add one.
            </p>
          ) : (
            formData.accounts.map((account, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={account.key}
                    onChange={(e) => updateAccount(index, 'key', e.target.value)}
                    placeholder="e.g., SSH User, Admin Account"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    value={account.value}
                    onChange={(e) => updateAccount(index, 'value', e.target.value)}
                    placeholder="e.g., root, admin@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeAccount(index)}
                  disabled={isSubmitting}
                  className="btn-sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Add accounts with access to this asset (SSH users, admin accounts, etc.)
        </p>
      </div>

      {/* Description */}
      <div className="form-group">
        <Label htmlFor="description" className="font-bold">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Additional notes about this asset..."
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      {/* Projects with Roles */}
      <div className="form-group">
        <Label className="font-bold">Projects & Roles</Label>
        <div className="border-2 border-black rounded-md p-4 space-y-3">
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects available</p>
          ) : (
            projects.map((project) => {
              const projectId = project._id?.toString()
              const assetProject = formData.projects.find(p => p.projectId === projectId)
              const isSelected = !!assetProject

              return (
                <div key={projectId} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`project-${projectId}`}
                      checked={isSelected}
                      onChange={() => toggleProject(projectId)}
                      disabled={isSubmitting}
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor={`project-${projectId}`}
                      className="font-bold cursor-pointer"
                    >
                      {project.key} - {project.name}
                    </Label>
                  </div>
                  {isSelected && (
                    <div className="ml-6">
                      <Input
                        type="text"
                        value={assetProject?.role || ''}
                        onChange={(e) => updateProjectRole(projectId, e.target.value)}
                        placeholder="Role for this project (e.g., Production Server, Backup)"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Select projects and specify the role this asset plays for each
        </p>
      </div>

      {/* Tags */}
      <div className="form-group">
        <Label htmlFor="tags" className="font-bold">Tags</Label>
        <Input
          id="tags"
          type="text"
          value={formData.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          placeholder="Comma-separated: production, critical, monitoring"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving...' : (asset ? 'Update Asset' : 'Create Asset')}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="btn-outline">
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
