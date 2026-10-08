'use client'

import Link from 'next/link'
import { FeatureWithDetails } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { IssuePriorityBadge } from '@/app/issues/components/IssuePriorityBadge'
import { FeatureStatusBadge, FeatureProgressBar } from './FeatureBadges'
import { Tag, User, Calendar } from 'lucide-react'

interface FeatureCardProps {
  feature: FeatureWithDetails
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <Link href={`/features/${feature._id}`}>
      <div className="card hover:shadow-lg transition-all cursor-pointer h-full">
        <div className="card-header">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-lg font-black text-primary">{feature.featureNumber}</span>
            <FeatureStatusBadge status={feature.status} />
            <IssuePriorityBadge priority={feature.priority} />
          </div>
          <h3 className="text-xl font-black hover:underline mb-2">{feature.title}</h3>
        </div>

        <div className="card-content space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{feature.description}</p>

          <FeatureProgressBar progress={feature.progress} />

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 bg-muted border-2 border-black text-xs font-bold">
              {feature.project.key}
            </span>
            <span className="flex items-center gap-1.5 font-bold">
              <User className="h-4 w-4" />
              {feature.owner?.name || 'Unowned'}
            </span>
            {feature.targetDate && (
              <span className="flex items-center gap-1.5 font-bold">
                <Calendar className="h-4 w-4" />
                {formatDate(new Date(feature.targetDate))}
              </span>
            )}
          </div>

          {feature.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-1">
                {feature.tags.map((tag, index) => (
                  <span key={index} className="badge badge-secondary text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
