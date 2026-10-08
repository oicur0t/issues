'use client'

import Link from 'next/link'
import { AssetWithProjects, AssetStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { AssetWarnings } from './AssetWarnings'
import { Globe, MapPin, Tag, FolderKanban, DollarSign, ExternalLink, User } from 'lucide-react'

interface AssetCardProps {
  asset: AssetWithProjects
  className?: string
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

export function AssetCard({ asset, className }: AssetCardProps) {
  const statusCfg = statusConfig[asset.status]

  return (
    <Link href={`/assets/${asset._id}`}>
      <div className={`card hover:shadow-lg transition-all cursor-pointer ${className || ''}`}>
        <div className="card-header">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Asset Type & Status */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-300 border-2 border-black font-black text-sm"
                  style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                >
                  {asset.type}
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${statusCfg.color} border-2 border-black font-black text-sm`}
                  style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                >
                  {statusCfg.label}
                </div>
              </div>

              <h3 className="text-xl font-black hover:underline mb-2">
                {asset.name}
              </h3>

              {/* Hostname */}
              {asset.hostname && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Globe className="h-4 w-4" />
                  <code className="font-mono font-bold">{asset.hostname}</code>
                </div>
              )}

              {/* IP Addresses */}
              {asset.ipAddresses.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Globe className="h-4 w-4" />
                  <div className="flex gap-2 flex-wrap">
                    {asset.ipAddresses.slice(0, 2).map((ip, index) => (
                      <code key={index} className="font-mono font-bold text-xs">
                        {ip}
                      </code>
                    ))}
                    {asset.ipAddresses.length > 2 && (
                      <span className="text-xs font-bold">
                        +{asset.ipAddresses.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Provider & Location */}
              <div className="flex items-center gap-4 mt-2">
                {asset.provider && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="px-2 py-0.5 bg-white border-2 border-black text-xs font-bold">
                      {asset.provider}
                    </div>
                  </div>
                )}
                {asset.location && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="font-bold">{asset.location}</span>
                  </div>
                )}
              </div>

              {/* Tailscale sync: review flag and warnings */}
              {(asset.needsReview || (asset.tailscale?.warnings?.length ?? 0) > 0) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {asset.needsReview && (
                    <span
                      title="Discovered via Tailscale; add provider, location and notes"
                      className="inline-flex items-center px-2 py-0.5 bg-purple-200 border-2 border-black text-xs font-bold"
                    >
                      Needs review
                    </span>
                  )}
                  <AssetWarnings warnings={asset.tailscale?.warnings} max={2} />
                </div>
              )}

              {/* Cost & Vendor URL */}
              <div className="flex items-center gap-4 mt-2">
                {asset.cost !== undefined && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-bold">${asset.cost.toFixed(2)}</span>
                  </div>
                )}
                {asset.vendorUrl && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="font-bold text-xs truncate max-w-[200px]">Vendor Portal</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card-content">
          {/* Description */}
          {asset.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {asset.description}
            </p>
          )}

          {/* Accounts */}
          {asset.accounts.length > 0 && (
            <div className="flex items-start gap-2 mb-3">
              <User className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex flex-col gap-1">
                {asset.accounts.slice(0, 2).map((account, index) => (
                  <span
                    key={index}
                    className="text-xs font-bold text-muted-foreground"
                  >
                    {account.key}: {account.value}
                  </span>
                ))}
                {asset.accounts.length > 2 && (
                  <span className="text-xs font-bold text-muted-foreground">
                    +{asset.accounts.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Projects with Roles */}
          {asset.projects.length > 0 && (
            <div className="flex items-start gap-2 mb-3">
              <FolderKanban className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex flex-col gap-1">
                {asset.projects.map((project) => (
                  <div
                    key={project._id.toString()}
                    className="flex items-center gap-2"
                  >
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted border-2 border-black text-xs font-bold"
                      style={{ boxShadow: '1px 1px 0px 0px rgba(0, 0, 0, 1)' }}
                      onClick={(e) => {
                        e.preventDefault()
                        window.location.href = `/projects/${project._id.toString()}`
                      }}
                    >
                      {project.key}
                    </span>
                    {project.role && (
                      <span className="text-xs text-muted-foreground italic">
                        {project.role}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {asset.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="badge badge-secondary text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer - OS & Created */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-3 border-t-2 border-black/10">
            <div className="flex items-center gap-2">
              {asset.os && (
                <span className="font-bold">{asset.os}</span>
              )}
            </div>
            <div className="font-bold">
              {formatDate(asset.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
