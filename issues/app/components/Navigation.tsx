'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from './UserProvider'
import { logout } from '@/app/(auth)/logout/actions'
import { cn } from '@/lib/utils'
import {
  FileText,
  BookOpen,
  Users,
  LogOut,
  Home,
  Plus,
  Search,
  Settings,
  LayoutGrid,
  FolderKanban,
  Key,
  Server,
  Sparkles
} from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  const { session } = useUser()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // Server action handles redirect
      console.error('Logout error:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Issues', href: '/issues', icon: FileText },
    { name: 'Features', href: '/features', icon: Sparkles },
    { name: 'Assets', href: '/assets', icon: Server },
    { name: 'Wiki', href: '/wiki', icon: BookOpen },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Profile', href: '/profile', icon: Settings },
  ]

  const quickActions = [
    { name: 'New Issue', href: '/issues/new', icon: Plus },
    { name: 'New Feature', href: '/features/new', icon: Plus },
    { name: 'New Asset', href: '/assets/new', icon: Plus },
    { name: 'New Wiki', href: '/wiki/new', icon: Plus },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-primary border-r-4 border-black flex flex-col" style={{ boxShadow: '8px 0px 0px 0px rgba(0, 0, 0, 1)' }}>
      {/* Logo/Brand */}
      <div className="p-6 border-b-4 border-black/20">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-secondary border-4 border-black flex items-center justify-center" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
            <LayoutGrid className="h-6 w-6 text-black" />
          </div>
          <span className="text-2xl font-black text-white">ISSUES</span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 py-4 border-b-4 border-black/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 border-2 border-white/30 text-white placeholder:text-white/60 font-bold text-sm focus:outline-none focus:border-white/50 transition-colors"
          />
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-bold rounded-none transition-all group',
                  isActive
                    ? 'bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-white hover:bg-white/10 hover:translate-x-1'
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-black" : "text-white"
                )} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="pt-6 mt-6 border-t-2 border-white/20">
          <div className="px-3 pb-2 text-xs font-black text-white/60 uppercase tracking-wider">
            Quick Actions
          </div>
          <div className="space-y-1">
            {quickActions.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-bold text-white hover:bg-white/10 hover:translate-x-1 rounded-none transition-all"
              >
                <item.icon className="mr-3 h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t-4 border-black/20">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-secondary border-3 border-black flex items-center justify-center text-black text-sm font-black" style={{ boxShadow: '2px 2px 0px 0px rgba(0, 0, 0, 1)' }}>
            {session?.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-white truncate">
              {session?.user.name}
            </div>
            <div className="text-xs font-bold text-white/60 truncate">
              {session?.user.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-3 py-2 text-sm font-bold text-white bg-destructive border-2 border-black hover:translate-x-1 hover:translate-y-1 transition-all"
          style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </button>
        <div className="mt-3 text-center text-xs font-bold text-white/50" title="Build number (bumped on each GitHub sync)">
          Build {process.env.NEXT_PUBLIC_BUILD_NUMBER}
        </div>
      </div>
    </aside>
  )
}
