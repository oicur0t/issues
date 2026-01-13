'use client'

import { createContext, useContext, ReactNode } from 'react'
import { UserSession } from '@/lib/types'

interface UserContextType {
  session: UserSession | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

interface UserProviderProps {
  children: ReactNode
  session: UserSession | null
}

export function UserProvider({ children, session }: UserProviderProps) {
  return (
    <UserContext.Provider value={{ session }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}