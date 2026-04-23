"use client"

import { SessionProvider, useSession as useNextAuthSession, signOut as nextAuthSignOut } from "next-auth/react"
import { ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// Re-export hooks to maintain compatibility with existing components
export const useSession = useNextAuthSession
export const signOut = nextAuthSignOut
