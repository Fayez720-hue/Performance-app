'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCustomSession } from "@/lib/auth-client"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { data: session, status } = useCustomSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (status === "unauthenticated") {
      router.push("/login")
    } else if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router, mounted])

  // Return a loading state during SSR/Build to prevent useContext crashes
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  )
}