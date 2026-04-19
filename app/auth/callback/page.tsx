"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  useEffect(() => {
    // Attempt to redirect to the app's custom scheme
    // This will only work if the app is installed
    const appUrl = `com.canshift.performanceapp://callback?url=${encodeURIComponent(callbackUrl)}`

    // Check if we are in a regular browser (not the Capacitor WebView)
    const isCapacitor = (window as any).Capacitor !== undefined

    if (!isCapacitor) {
      // We're likely in the system browser after Google Sign-In
      // Try to jump back to the app
      window.location.href = appUrl

      // Fallback: If the app doesn't open within 2 seconds, redirect to the web dashboard
      const timeout = setTimeout(() => {
        router.push(callbackUrl)
      }, 2500)

      return () => clearTimeout(timeout)
    } else {
      // We are already in the app, just go to the dashboard
      router.push(callbackUrl)
    }
  }, [router, callbackUrl])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing Sign-In</h2>
        <p className="text-muted-foreground">Redirecting you back to the app...</p>
      </div>
    </div>
  )
}
