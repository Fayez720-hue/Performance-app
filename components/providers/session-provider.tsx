"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

interface User {
  name: string
  email: string
  image?: string | null
  role?: string
}

interface Session {
  user: User | null
  expires: string | null
}

interface SessionContextType {
  data: Session
  status: "loading" | "authenticated" | "unauthenticated"
  update: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ user: null, expires: null })
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth")
      const data = await res.json()
      setSession(data)
      setStatus(data.user ? "authenticated" : "unauthenticated")
    } catch (error) {
      console.error("Failed to fetch session:", error)
      setStatus("unauthenticated")
    }
  }

  const signOut = async () => {
    await fetch("/api/auth", { method: "DELETE" })
    window.location.href = "/"
  }

  useEffect(() => {
    fetchSession()
  }, [])

  return (
    <SessionContext.Provider
      value={{
        data: session,
        status,
        update: fetchSession,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error("useSession must be used within an AuthProvider")
  }
  return context
}
