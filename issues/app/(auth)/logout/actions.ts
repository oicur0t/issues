'use server'

import { redirect } from 'next/navigation'
import { logout as authLogout } from '@/lib/auth'

export async function logout() {
  await authLogout()
  redirect('/login')
}