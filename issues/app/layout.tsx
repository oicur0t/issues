import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { getCurrentSession } from '@/lib/auth'
import { Navigation } from '@/components/Navigation'
import { UserProvider } from '@/components/UserProvider'

const inter = Inter({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Issue Tracker - Internal Project Management',
  description: 'Internal issue tracking and wiki system for rapid iteration and project management',
  keywords: ['issue tracking', 'project management', 'wiki', 'documentation'],
  authors: [{ name: 'Issue Tracker Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#ffffff',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCurrentSession()

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <UserProvider session={session}>
          <div className="flex min-h-screen bg-background">
            {session?.isLoggedIn && <Navigation />}
            <main className={session?.isLoggedIn ? 'flex-1 ml-64 p-8' : 'flex-1'}>
              {children}
            </main>
          </div>
        </UserProvider>
      </body>
    </html>
  )
}