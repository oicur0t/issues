import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { ApiKeysManager } from './ApiKeysManager'

export const dynamic = 'force-dynamic'

export default async function ApiKeysPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="space-y-8">
      <div className="border-4 border-black p-6 bg-secondary" style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}>
        <h1 className="text-5xl font-black text-foreground uppercase tracking-tight">
          Service API Keys
        </h1>
        <p className="text-lg font-bold text-foreground/80 mt-2">
          Manage API keys for services and automated systems (phone-home, CI/CD, scripts)
        </p>
      </div>

      <ApiKeysManager />
    </div>
  )
}
