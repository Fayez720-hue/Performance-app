"use client"

import { SessionProvider, useSession as useNextAuthSession } from "next-auth/react"
import { ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// Re-export useSession to maintain compatibility with existing components
export const useSession = useNextAuthSession
