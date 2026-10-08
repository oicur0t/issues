'use client'

import { IssueWithAssignee } from '@/lib/types'
import { InlineStatusSelect } from '../../components/InlineStatusSelect'
import { InlinePrioritySelect } from '../../components/InlinePrioritySelect'
import { InlineTitleEdit } from '../../components/InlineTitleEdit'
import { InlineDescriptionEdit } from '../../components/InlineDescriptionEdit'
import { InlineAssigneeSelect } from '../../components/InlineAssigneeSelect'
import { InlineTagsEdit } from '../../components/InlineTagsEdit'
import { InlineDueDateEdit } from '../../components/InlineDueDateEdit'
import { ClaimControl } from '../../components/ClaimControl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUserInitials, generateAvatarColor } from '@/lib/utils'
import { LocalDate } from '@/app/components/LocalDate'
import { Calendar, User, Tag, FolderKanban, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface IssueViewClientProps {
  issue: IssueWithAssignee
}

export function IssueViewClient({ issue }: IssueViewClientProps) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-white">
          <CardHeader>
            <div className="space-y-4">
              {/* Issue Number & Project */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-primary">
                  {issue.issueNumber}
                </span>
                <Link
                  href={`/projects/${issue.project._id.toString()}`}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-muted border-3 border-black font-bold text-sm hover:translate-x-1 hover:translate-y-1 transition-all"
                  style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                >
                  <FolderKanban className="h-4 w-4" />
                  {issue.project.name}
                </Link>
                {issue.feature && (
                  <Link
                    href={`/features/${issue.feature._id.toString()}`}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-secondary border-3 border-black font-bold text-sm hover:translate-x-1 hover:translate-y-1 transition-all"
                    style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                  >
                    <Sparkles className="h-4 w-4" />
                    {issue.feature.featureNumber}: {issue.feature.title}
                  </Link>
                )}
              </div>

              {/* Title - Inline Editable */}
              <InlineTitleEdit
                issueId={issue._id!.toString()}
                currentTitle={issue.title}
                onUpdate={handleUpdate}
              />

              {/* Status & Priority */}
              <div className="flex items-center gap-2">
                <InlineStatusSelect
                  key={issue.status}
                  issueId={issue._id!.toString()}
                  currentStatus={issue.status}
                  onUpdate={handleUpdate}
                />
                <InlinePrioritySelect
                  key={issue.priority}
                  issueId={issue._id!.toString()}
                  currentPriority={issue.priority}
                  onUpdate={handleUpdate}
                />
              </div>

              {/* Who is working on it */}
              <ClaimControl issue={issue} />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Description - Inline Editable */}
            <div>
              <h3 className="font-black text-lg mb-3 uppercase">Description</h3>
              <InlineDescriptionEdit
                issueId={issue._id!.toString()}
                currentDescription={issue.description}
                onUpdate={handleUpdate}
              />
            </div>

            {/* Tags - Inline Editable */}
            <div>
              <h3 className="font-black text-lg mb-3 uppercase flex items-center">
                <Tag className="h-5 w-5 mr-2" />
                Tags
              </h3>
              <InlineTagsEdit
                issueId={issue._id!.toString()}
                currentTags={issue.tags}
                onUpdate={handleUpdate}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* People */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl font-black uppercase">People</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Assignee - Inline Editable */}
            <div>
              <h4 className="font-black text-sm mb-2 flex items-center uppercase">
                <User className="h-4 w-4 mr-2" />
                Assignee
              </h4>
              <InlineAssigneeSelect
                key={issue.assignee?._id.toString() ?? 'unassigned'}
                issueId={issue._id!.toString()}
                currentAssignee={issue.assignee}
                onUpdate={handleUpdate}
              />
            </div>

            {/* Reporter - Read Only */}
            <div>
              <h4 className="font-black text-sm mb-2 uppercase">Reporter</h4>
              <div className="flex items-center gap-3 p-2 bg-muted/20">
                <div
                  className={`h-8 w-8 border-3 border-black flex items-center justify-center text-white text-sm font-medium ${generateAvatarColor(issue.reporter.email)}`}
                  style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
                >
                  {getUserInitials(issue.reporter.name)}
                </div>
                <div>
                  <div className="font-black text-sm">{issue.reporter.name}</div>
                  <div className="text-xs font-bold text-muted-foreground">
                    {issue.reporter.email}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl font-black uppercase flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="font-black text-sm uppercase">Created</div>
              <div className="text-sm font-bold text-muted-foreground">
                <LocalDate date={issue.createdAt} />
              </div>
            </div>

            <div>
              <div className="font-black text-sm uppercase">Updated</div>
              <div className="text-sm font-bold text-muted-foreground">
                <LocalDate date={issue.updatedAt} />
              </div>
            </div>

            {/* Due Date - Inline Editable */}
            <div>
              <div className="font-black text-sm mb-2 uppercase">Due Date</div>
              <InlineDueDateEdit
                issueId={issue._id!.toString()}
                currentDueDate={issue.dueDate}
                onUpdate={handleUpdate}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
