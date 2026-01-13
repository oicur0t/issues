import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { getProject } from '../actions'
import { getIssues } from '@/app/issues/actions'
import { ProjectViewClient } from './components/ProjectViewClient'
import { DeleteProjectButton } from './components/DeleteProjectButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

interface ProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  const canEdit = session.user.role === 'admin' || session.user.role === 'developer'
  const canDelete = session.user.role === 'admin' || session.user.role === 'developer'
  const canCreateIssue = session.user.role === 'admin' || session.user.role === 'developer'

  // Get issues for this project
  const issues = await getIssues({ projectId: id })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="btn-ghost btn-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {canDelete && (
            <DeleteProjectButton
              projectId={id}
              projectName={project.name}
              issueCount={issues.length}
            />
          )}
        </div>
      </div>

      {/* Project Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectViewClient
            id={id}
            name={project.name}
            key_={project.key}
            description={project.description}
            canEdit={canEdit}
          />

          {/* Issues Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-black">ISSUES</CardTitle>
                {canCreateIssue && (
                  <Link href={`/issues/new?project=${id}`}>
                    <Button className="btn-primary btn-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Issue
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {issues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No issues yet</p>
                  {canCreateIssue && (
                    <Link href={`/issues/new?project=${id}`}>
                      <Button className="btn-primary mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Issue
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {issues.map((issue) => (
                    <Link
                      key={issue._id?.toString()}
                      href={`/issues/${issue._id?.toString()}`}
                    >
                      <div
                        className="p-4 border-4 border-black hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer"
                        style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-black text-primary">
                                {issue.issueNumber}
                              </span>
                              <span className={`badge status-${issue.status}`}>
                                {issue.status.replace('_', ' ')}
                              </span>
                              <span className={`badge priority-${issue.priority}`}>
                                {issue.priority}
                              </span>
                            </div>
                            <h3 className="font-bold">{issue.title}</h3>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-black">{issues.length}</div>
                <div className="text-sm text-muted-foreground">Total Issues</div>
              </div>
              <div>
                <div className="text-3xl font-black">
                  {issues.filter(i => i.status === 'backlog').length}
                </div>
                <div className="text-sm text-muted-foreground">Backlog</div>
              </div>
              <div>
                <div className="text-3xl font-black">
                  {issues.filter(i => i.status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-3xl font-black">
                  {issues.filter(i => i.status === 'fixed').length}
                </div>
                <div className="text-sm text-muted-foreground">Fixed</div>
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-bold">Project Key</div>
                <div className="text-muted-foreground">{project.key}</div>
              </div>
              <div>
                <div className="font-bold">Created By</div>
                <div className="text-muted-foreground">{project.creator.name}</div>
              </div>
              <div>
                <div className="font-bold">Created</div>
                <div className="text-muted-foreground">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
