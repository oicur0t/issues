'use client'

import { AssetWithProjects, AssetStatus } from '@/lib/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LocalDate } from '@/app/components/LocalDate'
import { Globe, MapPin, Tag, FolderKanban, User, DollarSign, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface AssetViewClientProps {
  asset: AssetWithProjects
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
}

export function AssetViewClient({ asset }: AssetViewClientProps) {
  const statusCfg = statusConfig[asset.status]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
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
              <h1 className="text-4xl font-black">{asset.name}</h1>

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
