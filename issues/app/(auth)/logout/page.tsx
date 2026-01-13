import { logout } from './actions'

export const dynamic = 'force-dynamic'

export default function LogoutPage() {
  // This page will immediately trigger the logout action
  logout()
  
  // This won't be rendered due to the redirect in the logout action
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p>You will be redirected to the login page.</p>
      </div>
    </div>
  )
}