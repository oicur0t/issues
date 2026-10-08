'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AssetWithProjects, AssetStatus } from '@/lib/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AssetForm } from '../../components/AssetForm'
import { updateAsset } from '../../actions'
import { LocalDate } from '@/app/components/LocalDate'
import { AssetWarnings } from '../../components/AssetWarnings'
import { Globe, MapPin, Tag, FolderKanban, User, DollarSign, ExternalLink, Pencil, ListPlus } from 'lucide-react'
import Link from 'next/link'

interface AssetViewClientProps {
  asset: AssetWithProjects
  projects: Array<{ _id: string; name: string; key: string }>
  canEdit: boolean
}

const statusConfig: Record<AssetStatus, { color: string; label: string }> = {
  active: {
    color: 'bg-green-300',
    label: 'Active'
  },
  maintenance: {
    color: 'bg-yellow-300',
    label: 'Maintenance'
  },
  decommissioned: {
    color: 'bg-gray-300',
    label: 'Decommissioned'
  },
  removed: {
    color: 'bg-red-300',
    label: 'Removed'
  },
}

export function AssetViewClient({ asset, projects, canEdit }: Readonly<AssetViewClientProps>) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const markReviewed = () => {
    startTransition(async () => {
      await updateAsset(asset._id!.toString(), { needsReview: false })
      router.refresh()
    })
  }
  const statusCfg = statusConfig[asset.status]

  if (isEditing) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <h2 className="text-2xl font-black">Edit {asset.name}</h2>
          {asset.tailscale && (
            <p className="text-sm text-muted-foreground font-bold">
              Tailscale details are managed by the sync and are not editable here. Everything below is yours to change.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <AssetForm
            asset={{
              _id: asset._id!.toString(),
              name: asset.name,
              hostname: asset.hostname,
              ipAddresses: asset.ipAddresses ?? [],
              type: asset.type,
              status: asset.status,
              os: asset.os,
              provider: asset.provider,
              location: asset.location,
              cost: asset.cost,
              vendorUrl: asset.vendorUrl,
              accounts: asset.accounts ?? [],
              customFields: asset.customFields ?? [],
              description: asset.description,
              projects: asset.projects ?? [],
              tags: asset.tags ?? [],
            }}
            projects={projects}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {asset.tailscale && (
          <Card className="bg-white">
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-black uppercase">Tailscale <span className="text-xs font-bold normal-case text-muted-foreground">(read-only, managed by the sync)</span></h2>
                {asset.needsReview && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 bg-purple-200 border-2 border-black text-xs font-bold">
                      Needs review: add provider, location and notes
                    </span>
                    {canEdit && (
                      <Button variant="outline" size="sm" className="btn-outline" onClick={markReviewed} disabled={isPending}>
                        {isPending ? 'Saving...' : 'Mark reviewed'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <AssetWarnings warnings={asset.tailscale.warnings} />
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="font-bold text-muted-foreground">Name</dt>
                  <dd className="font-mono font-bold break-all">{asset.tailscale.name}</dd>
                </div>
                <div>
                  <dt className="font-bold text-muted-foreground">Addresses</dt>
                  <dd className="font-mono font-bold">{asset.tailscale.addresses.join(', ')}</dd>
                </div>
                <div>
                  <dt className="font-bold text-muted-foreground">OS / Client</dt>
                  <dd className="font-bold">
                    {asset.tailscale.os ?? '-'} / {asset.tailscale.clientVersion ?? '-'}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-muted-foreground">Connection</dt>
                  <dd className="font-bold">
                    {asset.tailscale.connectedToControl || !asset.tailscale.lastSeen
                      ? 'Connected'
                      : <>Last seen <LocalDate date={asset.tailscale.lastSeen} /></>}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-muted-foreground">Key expiry</dt>
                  <dd className="font-bold">
                    {asset.tailscale.keyExpiryDisabled || !asset.tailscale.expires
                      ? 'Disabled'
                      : <LocalDate date={asset.tailscale.expires} />}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-muted-foreground">Last synced</dt>
                  <dd className="font-bold"><LocalDate date={asset.tailscale.lastSyncedAt} /></dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white">
          <CardHeader>
            <div className="space-y-4">
              {/* Asset Type & Status Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-300 border-3 border-black font-black text-lg"
                  style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
                >
                  {asset.type}
                </div>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 ${statusCfg.color} border-3 border-black font-black text-lg`}
                  style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
                >
                  {statusCfg.label}
                </div>
              </div>

              {/* Asset Name */}
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-4xl font-black">{asset.name}</h1>
                {canEdit && (
                  <Button variant="outline" className="btn-outline shrink-0" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              {/* Hostname */}
              {asset.hostname && (
                <div className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <code className="font-mono font-bold bg-muted px-2 py-1 rounded">
                    {asset.hostname}
                  </code>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* IP Addresses */}
            {asset.ipAddresses.length > 0 && (
              <div>
                <h3 className="font-black text-lg mb-3 uppercase flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  IP Addresses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {asset.ipAddresses.map((ip, index) => (
                    <code
                      key={index}
                      className="font-mono font-bold bg-muted px-3 py-1.5 border-2 border-black text-sm"
                      style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                    >
                      {ip}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Accounts */}
            {asset.accounts.length > 0 && (
              <div>
                <h3 className="font-black text-lg mb-3 uppercase flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Accounts
                </h3>
                <div className="space-y-2">
                  {asset.accounts.map((account, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted border-2 border-black"
                      style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                    >
                      <span className="font-bold text-sm text-muted-foreground">{account.key}:</span>
                      <code className="font-mono font-bold text-sm">{account.value}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Fields */}
            {asset.customFields && asset.customFields.length > 0 && (
              <div>
                <h3 className="font-black text-lg mb-3 uppercase flex items-center">
                  <ListPlus className="h-5 w-5 mr-2" />
                  Custom Fields
                </h3>
                <div className="space-y-2">
                  {asset.customFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted border-2 border-black"
                      style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                    >
                      <span className="font-bold text-sm text-muted-foreground">{field.key}:</span>
                      <span className="font-bold text-sm">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {asset.description && (
              <div>
                <h3 className="font-black text-lg mb-3 uppercase">Description</h3>
                <p className="text-foreground/80 whitespace-pre-wrap">
                  {asset.description}
                </p>
              </div>
            )}

            {/* Projects with Roles */}
            {asset.projects.length > 0 && (
              <div>
                <h3 className="font-black text-lg mb-3 uppercase flex items-center">
                  <FolderKanban className="h-5 w-5 mr-2" />
                  Projects
                </h3>
                <div className="space-y-2">
                  {asset.projects.map((project) => (
                    <Link
                      key={project._id.toString()}
                      href={`/projects/${project._id.toString()}`}
                      className="flex items-center justify-between p-3 bg-muted border-3 border-black font-bold hover:translate-x-1 hover:translate-y-1 transition-all"
                      style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                    >
                      <span>{project.key} - {project.name}</span>
                      {project.role && (
                        <span className="text-sm text-muted-foreground italic">
                          {project.role}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {asset.tags.length > 0 && (
              <div>
                <h3 className="font-black text-lg mb-3 uppercase flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="badge badge-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <h3 className="font-black text-lg uppercase">Details</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OS */}
            {asset.os && (
              <div>
                <div className="text-sm font-bold text-muted-foreground mb-1">Operating System</div>
                <div className="font-bold">{asset.os}</div>
              </div>
            )}

            {/* Provider */}
            {asset.provider && (
              <div>
                <div className="text-sm font-bold text-muted-foreground mb-1">Provider</div>
                <div className="font-bold">{asset.provider}</div>
              </div>
            )}

            {/* Location */}
            {asset.location && (
              <div>
                <div className="text-sm font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </div>
                <div className="font-bold">{asset.location}</div>
              </div>
            )}

            {/* Cost */}
            {asset.cost !== undefined && (
              <div>
                <div className="text-sm font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Cost
                </div>
                <div className="font-bold">${asset.cost.toFixed(2)}</div>
              </div>
            )}

            {/* Vendor URL */}
            {asset.vendorUrl && (
              <div>
                <div className="text-sm font-bold text-muted-foreground mb-1 flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Vendor Portal
                </div>
                <a
                  href={asset.vendorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary hover:underline break-all"
                >
                  {asset.vendorUrl}
                </a>
              </div>
            )}

            {/* Creator */}
            <div>
              <div className="text-sm font-bold text-muted-foreground mb-1">Created By</div>
              <div className="font-bold">{asset.creator.name}</div>
            </div>

            {/* Created Date */}
            <div>
              <div className="text-sm font-bold text-muted-foreground mb-1">Created</div>
              <div className="font-bold"><LocalDate date={asset.createdAt} /></div>
            </div>

            {/* Updated Date */}
            <div>
              <div className="text-sm font-bold text-muted-foreground mb-1">Last Updated</div>
              <div className="font-bold"><LocalDate date={asset.updatedAt} /></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
