import Link from 'next/link'
import { getCurrentSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileText,
  BookOpen,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Calendar,
  Server,
  Sparkles,
  FolderKanban,
} from 'lucide-react'
import { getDashboardStats } from '@/app/dashboard/actions'
import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

type Stats = Awaited<ReturnType<typeof getDashboardStats>>

/** One card in the top row: icon, label, big number and a note, all centered */
function TotalCard({
  title,
  value,
  note,
  icon,
  href,
  className,
}: Readonly<{ title: string; value: number; note: string; icon: ReactNode; href: string; className: string }>) {
  return (
    <Link href={href} className="block hover:translate-x-1 hover:translate-y-1 transition-transform">
      <Card className={`${className} h-full text-center`}>
        <CardHeader className="flex flex-col items-center space-y-3 pb-3">
          <div className="p-2 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
            {icon}
          </div>
          <CardTitle className="text-sm font-black uppercase">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-black">{value}</div>
          <p className="text-xs font-bold text-black/70 mt-2">{note}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function MiniStat({ label, value, className }: Readonly<{ label: string; value: number; className: string }>) {
  return (
    <div className={`p-2 border-2 border-black text-center ${className}`}>
      <div className="text-xs font-bold text-black/70">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  )
}

function featureSummary(f: Stats['projects']['items'][number]['features']): string {
  const parts: Array<[number, string]> = [
    [f.inProgress, 'in progress'],
    [f.planned, 'planned'],
    [f.proposed, 'proposed'],
    [f.shipped, 'shipped'],
    [f.dropped, 'dropped'],
  ]
  const text = parts.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}`).join(' · ')
  return text || 'No features'
}

function ProjectCard({ project }: Readonly<{ project: Stats['projects']['items'][number] }>) {
  const { issues, features } = project
  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <Link href={`/projects/${project.id}`} className="flex items-center gap-3 hover:underline">
          <span
            className="inline-flex items-center px-2 py-1 bg-secondary border-2 border-black text-sm font-black"
            style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}
          >
            {project.key}
          </span>
          <CardTitle className="text-xl truncate">{project.name}</CardTitle>
        </Link>
        <CardDescription className="font-bold">
          {issues.open} open of {issues.total} issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <MiniStat label="Backlog" value={issues.backlog} className="bg-pink-50" />
          <MiniStat label="Active" value={issues.inProgress} className="bg-cyan-50" />
          <MiniStat label="Blocked" value={issues.blocked} className="bg-orange-50" />
          <MiniStat label="Fixed" value={issues.fixed} className="bg-green-50" />
        </div>

        <div className="flex items-center justify-between gap-3 p-3 border-2 border-black bg-yellow-50">
          <div className="flex items-center gap-2 font-black text-sm">
            <Sparkles className="h-4 w-4" />
            Features
            <span className="text-2xl">{features.total}</span>
          </div>
          <span className="text-xs font-bold text-black/70 text-right">{featureSummary(features)}</span>
        </div>

        <div className="flex items-center justify-between text-sm font-bold">
          <span className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            {project.assets} linked asset{project.assets === 1 ? '' : 's'}
          </span>
          <Link href={`/projects/${project.id}`} className="underline">
            Open project
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function HomePage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  // Fetch real dashboard statistics
  const stats = await getDashboardStats()
  const { assets, features } = stats
  const gone = (assets.byStatus.removed ?? 0) + (assets.byStatus.decommissioned ?? 0)

  return (
    <div className="space-y-8">
      <div className="border-4 border-black p-6 bg-secondary" style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}>
        <h1 className="text-5xl font-black text-foreground uppercase tracking-tight">Dashboard</h1>
        <p className="text-lg font-bold text-foreground/80 mt-2">
          Welcome back, {session.user.name}! Here's what's happening with your projects.
        </p>
      </div>

      {/* Totals */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <TotalCard
          title="Total Issues"
          value={stats.issues.total}
          note={`${stats.issues.thisWeek} opened this week`}
          icon={<FileText className="h-5 w-5 text-black" />}
          href="/issues"
          className="bg-cyan-300"
        />
        <TotalCard
          title="Backlog"
          value={stats.issues.backlog}
          note={`${stats.issues.inProgress} in progress · ${stats.issues.blocked} blocked`}
          icon={<TrendingUp className="h-5 w-5 text-black" />}
          href="/issues"
          className="bg-pink-300"
        />
        <TotalCard
          title="Features"
          value={features.total}
          note={`${features.shipped} shipped · ${features.inProgress + features.planned} active`}
          icon={<Sparkles className="h-5 w-5 text-black" />}
          href="/features"
          className="bg-purple-300"
        />
        <TotalCard
          title="Assets"
          value={assets.total}
          note={`${assets.active} active · ${assets.withWarnings} with warnings`}
          icon={<Server className="h-5 w-5 text-black" />}
          href="/assets"
          className="bg-orange-300"
        />
        <TotalCard
          title="Wiki Pages"
          value={stats.wiki.total}
          note={`${stats.wiki.published} published`}
          icon={<BookOpen className="h-5 w-5 text-black" />}
          href="/wiki"
          className="bg-yellow-300"
        />
        <TotalCard
          title="Team Members"
          value={stats.users.total}
          note={`${stats.users.active} active`}
          icon={<Users className="h-5 w-5 text-black" />}
          href="/users"
          className="bg-green-300"
        />
      </div>

      {/* Per project */}
      <div className="space-y-4">
        <h2 className="text-3xl font-black uppercase flex items-center gap-3">
          <FolderKanban className="h-8 w-8" />
          Projects
        </h2>
        {stats.projects.items.length === 0 ? (
          <p className="font-bold text-muted-foreground">No projects yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.projects.items.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Clock className="h-6 w-6" />
              This Week
            </CardTitle>
            <CardDescription>
              Activity from the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border-2 border-black bg-cyan-50">
              <span className="font-bold text-sm">Issues Created</span>
              <span className="text-2xl font-black">{stats.issues.thisWeek}</span>
            </div>
            <div className="flex justify-between items-center p-3 border-2 border-black bg-yellow-50">
              <span className="font-bold text-sm">Wiki Pages Created</span>
              <span className="text-2xl font-black">{stats.wiki.thisWeek}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              This Month
            </CardTitle>
            <CardDescription>
              Activity this calendar month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border-2 border-black bg-pink-50">
              <span className="font-bold text-sm">Issues Created</span>
              <span className="text-2xl font-black">{stats.issues.thisMonth}</span>
            </div>
            <div className="flex justify-between items-center p-3 border-2 border-black bg-green-50">
              <span className="font-bold text-sm">Projects</span>
              <span className="text-2xl font-black">{stats.projects.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              Needs Attention
            </CardTitle>
            <CardDescription>
              Work and infrastructure requiring action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 border-2 border-black bg-orange-50">
              <span className="font-bold text-sm">Blocked Issues</span>
              <span className="text-2xl font-black">{stats.issues.blocked}</span>
            </div>
            <div className="flex justify-between items-center p-3 border-2 border-black bg-blue-50">
              <span className="font-bold text-sm">In Progress</span>
              <span className="text-2xl font-black">{stats.issues.inProgress}</span>
            </div>
            <Link href="/assets" className="flex justify-between items-center p-3 border-2 border-black bg-red-50">
              <span className="font-bold text-sm">Assets with warnings</span>
              <span className="text-2xl font-black">{assets.withWarnings}</span>
            </Link>
            <Link href="/assets" className="flex justify-between items-center p-3 border-2 border-black bg-purple-50">
              <span className="font-bold text-sm">Assets to review</span>
              <span className="text-2xl font-black">{assets.needsReview}</span>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-3xl">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/issues/new"
              className="block p-4 border-3 border-black bg-cyan-200 hover:translate-x-1 hover:translate-y-1 transition-transform font-bold"
              style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              <h4 className="font-black text-lg">Create New Issue</h4>
              <p className="text-sm font-bold text-black/70 mt-1">
                Start tracking a new task or bug
              </p>
            </Link>
            <Link
              href="/features/new"
              className="block p-4 border-3 border-black bg-purple-200 hover:translate-x-1 hover:translate-y-1 transition-transform font-bold"
              style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              <h4 className="font-black text-lg">Create New Feature</h4>
              <p className="text-sm font-bold text-black/70 mt-1">
                Describe something we intend to build
              </p>
            </Link>
            <Link
              href="/assets/new"
              className="block p-4 border-3 border-black bg-orange-200 hover:translate-x-1 hover:translate-y-1 transition-transform font-bold"
              style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              <h4 className="font-black text-lg">Add New Asset</h4>
              <p className="text-sm font-bold text-black/70 mt-1">
                Track a new infrastructure asset
              </p>
            </Link>
            <Link
              href="/wiki/new"
              className="block p-4 border-3 border-black bg-pink-200 hover:translate-x-1 hover:translate-y-1 transition-transform font-bold"
              style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              <h4 className="font-black text-lg">Create Wiki Page</h4>
              <p className="text-sm font-bold text-black/70 mt-1">
                Add documentation or knowledge base article
              </p>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Server className="h-8 w-8" />
              Assets Overview
            </CardTitle>
            <CardDescription>
              {assets.total} assets · {assets.active} active
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assets.total === 0 ? (
              <p className="font-bold text-muted-foreground">No assets tracked yet.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {assets.byCategory.map(category => (
                    <Link
                      key={category.key}
                      href="/assets"
                      className="p-3 border-2 border-black bg-cyan-50 hover:translate-x-0.5 hover:translate-y-0.5 transition-transform"
                    >
                      <div className="text-xs font-bold text-black/70">{category.label}</div>
                      <div className="text-2xl font-black">{category.count}</div>
                    </Link>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MiniStat label="Active" value={assets.active} className="bg-green-50" />
                  <MiniStat label="With warnings" value={assets.withWarnings} className="bg-red-50" />
                  <MiniStat label="Needs review" value={assets.needsReview} className="bg-purple-50" />
                  <MiniStat label="Removed / decommissioned" value={gone} className="bg-gray-100" />
                </div>
              </>
            )}
            <Link
              href="/assets"
              className="block p-4 border-3 border-black bg-orange-200 hover:translate-x-1 hover:translate-y-1 transition-transform font-bold text-center"
              style={{ boxShadow: '4px 4px 0px 0px rgba(0, 0, 0, 1)' }}
            >
              <h4 className="font-black text-lg">View All Assets</h4>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
