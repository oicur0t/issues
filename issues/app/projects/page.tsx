import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { getProjects } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, FolderKanban } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  const projects = await getProjects()
  const canCreate = session.user.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="border-4 border-black p-6 bg-secondary flex-1" style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}>
          <h1 className="text-5xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            <FolderKanban className="h-12 w-12" />
            Projects
          </h1>
          <p className="text-lg font-bold text-foreground/80 mt-2">
            Organize your issues into projects. {projects.length} project{projects.length !== 1 ? 's' : ''} available.
          </p>
        </div>

        {canCreate && (
          <Link href="/projects/new" className="ml-6">
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        )}
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start organizing issues
            </p>
            {canCreate && (
              <Link href="/projects/new">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project._id?.toString()} href={`/projects/${project._id?.toString()}`}>
              <Card className="hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 bg-primary border-4 border-black flex items-center justify-center"
                        style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
                      >
                        <span className="text-white font-black text-sm">
                          {project.key}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {project.key}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <CardDescription className="line-clamp-3">
                      {project.description}
                    </CardDescription>
                  )}
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Created by {project.creator.name}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
