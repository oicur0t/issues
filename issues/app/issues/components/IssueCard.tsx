'use client'

import Link from 'next/link'
import { IssueWithAssignee } from '@/lib/types'
import { InlineStatusSelect } from './InlineStatusSelect'
import { InlinePrioritySelect } from './InlinePrioritySelect'
import { formatDate, getUserInitials, generateAvatarColor } from '@/lib/utils'
import { Calendar, User, Tag, FolderKanban } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface IssueCardProps {
  issue: IssueWithAssignee
  className?: string
}

export function IssueCard({ issue, className }: IssueCardProps) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <div className={`card hover:shadow-md transition-shadow ${className || ''}`}>
      <div className="card-header">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Issue Number & Project */}
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/issues/${issue._id}`}
                className="font-black text-primary hover:underline"
              >
                {issue.issueNumber}
              </Link>
              <Link
                href={`/projects/${issue.project._id.toString()}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted border-2 border-black text-xs font-bold hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                style={{ boxShadow: '1px 1px 0px 0px rgba(0, 0, 0, 1)' }}
              >
                <FolderKanban className="h-3 w-3" />
                {issue.project.key}
              </Link>
            </div>

            <Link
              href={`/issues/${issue._id}`}
              className="text-lg font-bold hover:underline truncate block"
            >
              {issue.title}
            </Link>
            <div className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
              <InlineStatusSelect
                issueId={issue._id!.toString()}
                currentStatus={issue.status}
                onUpdate={handleUpdate}
              />
              <InlinePrioritySelect
                issueId={issue._id!.toString()}
                currentPriority={issue.priority}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {issue.dueDate && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(issue.dueDate)}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="card-content">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {issue.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Assignee */}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {issue.assignee ? (
                <div className="flex items-center gap-2">
                  <div 
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${generateAvatarColor(issue.assignee.email)}`}
                  >
                    {getUserInitials(issue.assignee.name)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {issue.assignee.name}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>
            
            {/* Reporter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">by</span>
              <div className="flex items-center gap-2">
                <div 
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${generateAvatarColor(issue.reporter.email)}`}
                >
                  {getUserInitials(issue.reporter.name)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {issue.reporter.name}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {formatDate(issue.createdAt)}
          </div>
        </div>
        
        {/* Tags */}
        {issue.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {issue.tags.map((tag, index) => (
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
      </div>
    </div>
  )
}