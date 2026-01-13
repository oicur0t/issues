import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth'
import { getUsers } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, getUserInitials, generateAvatarColor } from '@/lib/utils'
import { Users, Plus, Edit, Mail, Shield, UserCheck, UserX, Key } from 'lucide-react'
import Link from 'next/link'
import { DeleteUserButton } from './components/DeleteUserButton'
import { ApiKeyCell } from './components/ApiKeyCell'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await getCurrentSession()

  if (!session?.isLoggedIn) {
    redirect('/login')
  }

  // Only admins can access user management
  if (session.user.role !== 'admin') {
    redirect('/')
  }

  const users = await getUsers()

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      admin: { bg: '#fca5a5', text: 'text-black' },
      developer: { bg: '#93c5fd', text: 'text-black' },
      tester: { bg: '#fde047', text: 'text-black' },
      viewer: { bg: '#d1d5db', text: 'text-black' },
    }

    const style = roleStyles[role as keyof typeof roleStyles] || roleStyles.viewer

    return (
      <span className={`badge ${style.text}`} style={{ backgroundColor: style.bg }}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="border-4 border-black p-6 bg-secondary flex-1" style={{ boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)' }}>
          <h1 className="text-5xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
            <Users className="h-12 w-12" />
            User Management
          </h1>
          <p className="text-lg font-bold text-foreground/80 mt-2">
            Manage user accounts and permissions for your team.
          </p>
        </div>

        <Link href="/users/new" className="ml-6">
          <Button>
            <Plus className="h-5 w-5 mr-2" />
            Add User
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-cyan-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-black uppercase">Total Users</CardTitle>
            <div className="p-2 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
              <Users className="h-5 w-5 text-black" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-black uppercase">Active Users</CardTitle>
            <div className="p-2 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
              <UserCheck className="h-5 w-5 text-black" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black">
              {users.filter(user => user.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-black uppercase">Inactive Users</CardTitle>
            <div className="p-2 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
              <UserX className="h-5 w-5 text-black" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black">
              {users.filter(user => !user.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-black uppercase">Admins</CardTitle>
            <div className="p-2 bg-white border-3 border-black" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
              <Shield className="h-5 w-5 text-black" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black">
              {users.filter(user => user.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-3xl">All Users</CardTitle>
          <CardDescription>
            A list of all users in the system. You can manage their roles and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground mb-4">
                No users have been created yet.
              </div>
              <Link href="/users/new">
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First User
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="table-head">User</th>
                    <th className="table-head">Role</th>
                    <th className="table-head">Status</th>
                    <th className="table-head">API Key</th>
                    <th className="table-head">Created</th>
                    <th className="table-head">Last Updated</th>
                    <th className="table-head">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id?.toString()} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${generateAvatarColor(user.email)}`}
                          >
                            {getUserInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <ApiKeyCell apiKey={user.apiKey} userName={user.name} userId={user._id?.toString() || ''} />
                      </td>
                      <td className="table-cell">
                        <div className="text-sm">
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm">
                          {formatDate(user.updatedAt)}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <Link href={`/users/${user._id}/edit`}>
                            <Button variant="ghost" size="sm" className="btn-ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>

                          {user._id?.toString() !== session.user.id && (
                            <DeleteUserButton
                              userId={user._id?.toString() || ''}
                              userName={user.name}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}